import React, { useEffect, useMemo, useRef, useState } from 'react';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import { FaUserCircle } from 'react-icons/fa';

// Helpers
const placeholderAvatar = (name) => {
  const initial = (name?.[0] || 'U').toUpperCase();
  return (
    <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-4xl font-semibold">
      {initial}
    </div>
  );
};

const toCommaString = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');
const fromCommaString = (str) =>
  (str || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Advanced cropper modal: resizable crop box with handles, zoom & pan, aspect ratios
const CropperModal = ({ isOpen, src, onClose, onSave }) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [container, setContainer] = useState({ w: 640, h: 420 });

  // Image display transform
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left of image in container coords

  // Crop rect in container coords
  const [crop, setCrop] = useState({ x: 160, y: 60, w: 320, h: 240 });
  const MIN_W = 50;
  const MIN_H = 50;

  // Interaction state
  const [draggingImage, setDraggingImage] = useState(false);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const [dragHandle, setDragHandle] = useState(null); // 'move' | 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'
  const dragStartRef = useRef({ mx: 0, my: 0, posX: 0, posY: 0, crop: null });

  // Aspect ratio: 'free' | '1:1' | '16:9'
  const [ratio, setRatio] = useState('free');

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setScale(1);
    setDragHandle(null);
    setDraggingCrop(false);
    setDraggingImage(false);
  }, [isOpen, src]);

  // Handle container sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      setContainer({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const onImgLoad = (e) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });

    // Fit image to contain within container
    const fit = Math.min(container.w / w, container.h / h);
    setBaseScale(fit);
    const dispW = w * fit;
    const dispH = h * fit;
    setPos({ x: (container.w - dispW) / 2, y: (container.h - dispH) / 2 });

    // Default crop: centered rectangle 60% of container, clamp to image bounds
    const cw = Math.min(container.w * 0.6, dispW);
    const ch = Math.min(container.h * 0.6, dispH);
    setCrop({
      x: Math.round((container.w - cw) / 2),
      y: Math.round((container.h - ch) / 2),
      w: Math.round(cw),
      h: Math.round(ch),
    });
  };

  const dispW = natural.w * baseScale * scale;
  const dispH = natural.h * baseScale * scale;
  const imageBounds = { x: pos.x, y: pos.y, w: dispW, h: dispH };

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

  // Ensure crop stays within image bounds
  const clampCrop = (next) => {
    const maxX = imageBounds.x + imageBounds.w;
    const maxY = imageBounds.y + imageBounds.h;
    const clamped = { ...next };
    clamped.w = Math.max(MIN_W, Math.min(next.w, imageBounds.w));
    clamped.h = Math.max(MIN_H, Math.min(next.h, imageBounds.h));
    clamped.x = clamp(next.x, imageBounds.x, maxX - clamped.w);
    clamped.y = clamp(next.y, imageBounds.y, maxY - clamped.h);
    return clamped;
  };

  // Image pan
  const startPanImage = (mx, my) => {
    setDraggingImage(true);
    dragStartRef.current = { mx, my, posX: pos.x, posY: pos.y };
  };
  const doPanImage = (mx, my) => {
    const dx = mx - dragStartRef.current.mx;
    const dy = my - dragStartRef.current.my;
    setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStartRef.current.mx = mx; // continuous
    dragStartRef.current.my = my;
  };

  // Crop move/resize
  const startCropDrag = (mx, my, handle) => {
    setDraggingCrop(true);
    setDragHandle(handle);
    dragStartRef.current = { mx, my, crop: { ...crop } };
  };
  const doCropDrag = (mx, my) => {
    const { crop: start } = dragStartRef.current;
    const dx = mx - dragStartRef.current.mx;
    const dy = my - dragStartRef.current.my;

    let next = { ...start };

    const applyAspect = (w, h) => {
      if (ratio === '1:1') {
        const s = Math.min(w, h);
        return { w: s, h: s };
      }
      if (ratio === '16:9') {
        // maintain width:height = 16:9
        const targetH = Math.round((w / 16) * 9);
        if (targetH <= h) return { w, h: targetH };
        const targetW = Math.round((h / 9) * 16);
        return { w: targetW, h };
      }
      return { w, h };
    };

    switch (dragHandle) {
      case 'move':
        next.x = start.x + dx;
        next.y = start.y + dy;
        break;
      case 'e': {
        let w = start.w + dx;
        let h = start.h;
        ({ w, h } = applyAspect(w, h));
        next.w = w;
        next.h = h;
        break;
      }
      case 's': {
        let w = start.w;
        let h = start.h + dy;
        ({ w, h } = applyAspect(w, h));
        next.w = w;
        next.h = h;
        break;
      }
      case 'w': {
        let w = start.w - dx;
        let h = start.h;
        ({ w, h } = applyAspect(w, h));
        next.x = start.x + (start.w - w);
        next.w = w;
        next.h = h;
        break;
      }
      case 'n': {
        let w = start.w;
        let h = start.h - dy;
        ({ w, h } = applyAspect(w, h));
        next.y = start.y + (start.h - h);
        next.w = w;
        next.h = h;
        break;
      }
      case 'ne': {
        let w = start.w + dx;
        let h = start.h - dy;
        ({ w, h } = applyAspect(w, h));
        next.y = start.y + (start.h - h);
        next.w = w;
        next.h = h;
        break;
      }
      case 'nw': {
        let w = start.w - dx;
        let h = start.h - dy;
        ({ w, h } = applyAspect(w, h));
        next.x = start.x + (start.w - w);
        next.y = start.y + (start.h - h);
        next.w = w;
        next.h = h;
        break;
      }
      case 'se': {
        let w = start.w + dx;
        let h = start.h + dy;
        ({ w, h } = applyAspect(w, h));
        next.w = w;
        next.h = h;
        break;
      }
      case 'sw': {
        let w = start.w - dx;
        let h = start.h + dy;
        ({ w, h } = applyAspect(w, h));
        next.x = start.x + (start.w - w);
        next.w = w;
        next.h = h;
        break;
      }
      default:
        break;
    }

    next = clampCrop(next);
    setCrop(next);
  };

  // Global listeners for dragging
  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      if (draggingImage) doPanImage(mx, my);
      if (draggingCrop && dragHandle) doCropDrag(mx, my);
    };
    const onUp = () => {
      setDraggingImage(false);
      setDraggingCrop(false);
      setDragHandle(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isOpen, draggingImage, draggingCrop, dragHandle, pos, crop, scale, baseScale]);

  // Touch listeners
  const onTouchMove = (e) => {
    if (!draggingImage && !draggingCrop) return;
    const t = e.touches[0];
    if (!t) return;
    const mx = t.clientX;
    const my = t.clientY;
    if (draggingImage) doPanImage(mx, my);
    if (draggingCrop && dragHandle) doCropDrag(mx, my);
  };
  const onTouchEnd = () => {
    setDraggingImage(false);
    setDraggingCrop(false);
    setDragHandle(null);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY; // up = zoom in
    const factor = delta > 0 ? 1.03 : 0.97;
    const newScale = clamp(scale * factor, 0.2, 5);
    setScale(newScale);
  };

  const handleZoomSlider = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };

  // Save cropped image as data URL
  const handleSave = () => {
    const img = imgRef.current;
    if (!img || !natural.w || !natural.h) return;

    const ratioX = natural.w / (natural.w * baseScale * scale);
    const ratioY = natural.h / (natural.h * baseScale * scale);

    const srcX = (crop.x - pos.x) * ratioX;
    const srcY = (crop.y - pos.y) * ratioY;
    const srcW = crop.w * ratioX;
    const srcH = crop.h * ratioY;

    // Output size keeping aspect ratio, max dimension ~800
    const MAX_DIM = 800;
    let outW = MAX_DIM;
    let outH = Math.round((MAX_DIM * crop.h) / crop.w);
    if (outH > MAX_DIM) {
      outH = MAX_DIM;
      outW = Math.round((MAX_DIM * crop.w) / crop.h);
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onSave?.(dataUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit profile photo</h3>
          <div className="flex items-center gap-3">
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="free">Free</option>
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
            </select>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full h-[420px] bg-gray-100 rounded-lg overflow-hidden select-none"
          onWheel={onWheel}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Image layer */}
          {src ? (
            <img
              ref={imgRef}
              src={src}
              onLoad={onImgLoad}
              alt="Crop"
              draggable={false}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: dispW,
                height: dispH,
                cursor: draggingImage ? 'grabbing' : 'grab',
              }}
              onMouseDown={(e) => startPanImage(e.clientX, e.clientY)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) startPanImage(t.clientX, t.clientY);
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">No image</div>
          )}

          {/* Crop rectangle overlay */}
          <div
            className="absolute border-2 border-white/90 shadow-[0_0_0_20000px_rgba(0,0,0,0.4)]"
            style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
            onMouseDown={(e) => {
              e.stopPropagation();
              startCropDrag(e.clientX, e.clientY, 'move');
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              const t = e.touches[0];
              if (t) startCropDrag(t.clientX, t.clientY, 'move');
            }}
          >
            {/* Rule-of-thirds grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-1/3 border-t border-white/50" />
              <div className="absolute inset-x-0 top-2/3 border-t border-white/50" />
              <div className="absolute inset-y-0 left-1/3 border-l border-white/50" />
              <div className="absolute inset-y-0 left-2/3 border-l border-white/50" />
            </div>

            {/* Resize handles */}
            {['nw','n','ne','e','se','s','sw','w'].map((h) => (
              <div
                key={h}
                data-handle={h}
                className={
                  'absolute bg-white border border-gray-300 rounded-full w-3.5 h-3.5 ' +
                  (h === 'n' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize' : '') +
                  (h === 's' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize' : '') +
                  (h === 'e' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize' : '') +
                  (h === 'w' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize' : '') +
                  (h === 'nw' ? 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' : '') +
                  (h === 'ne' ? 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' : '') +
                  (h === 'se' ? 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize' : '') +
                  (h === 'sw' ? 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' : '')
                }
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startCropDrag(e.clientX, e.clientY, h);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const t = e.touches[0];
                  if (t) startCropDrag(t.clientX, t.clientY, h);
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-5">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Zoom</label>
            <input
              type="range"
              min={0.2}
              max={5}
              step={0.01}
              value={scale}
              onChange={handleZoomSlider}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserProfilePage = () => {
  const { user: authUser } = useAuthStore();
  const userId = authUser?._id || authUser?.userId;

  const { currentUser, fetchUserById, updateUser, isLoading, error, clearErrors } = useUserStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    address: '',
    skillsInput: '',
    languagesInput: '',
    profileUrl: '', // hidden, not displayed
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState(null); // success | error | null

  // Image cropper state
  const fileInputRef = useRef(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState('');

  // Load profile
  useEffect(() => {
    if (userId) fetchUserById(userId);
  }, [fetchUserById, userId]);

  // Hydrate form from currentUser
  useEffect(() => {
    if (!currentUser) return;
    setForm({
      name: currentUser.name || '',
      email: currentUser.email || '',
      contact_number: currentUser.contact_number || '',
      address: currentUser.address || '',
      skillsInput: toCommaString(currentUser.skills),
      languagesInput: toCommaString(currentUser.preferences?.languages),
      profileUrl: currentUser.profile_picture?.url || '',
    });
    setPreviewUrl(currentUser.profile_picture?.url || '');
  }, [currentUser]);

  const credentials = useMemo(() => currentUser?.credentialId || {}, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (saveStatus) setSaveStatus(null);
    if (error) clearErrors();
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || '';
      setCropSrc(result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (dataUrl) => {
    try {
      setPreviewUrl(dataUrl);
      setForm((prev) => ({ ...prev, profileUrl: dataUrl }));
      setCropperOpen(false);
      if (userId) {
        const updated = await updateUser(userId, { profile_picture: { url: dataUrl } });
        if (updated) setSaveStatus('success');
      }
    } catch (err) {
      console.error('Failed to save cropped image:', err);
      setSaveStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    const payload = {
      name: form.name?.trim(),
      email: form.email?.trim(),
      contact_number: form.contact_number?.trim(),
      address: form.address?.trim(),
      skills: fromCommaString(form.skillsInput),
      preferences: { languages: fromCommaString(form.languagesInput) },
    };

    if (form.profileUrl) payload.profile_picture = { url: form.profileUrl };

    const res = await updateUser(userId, payload);
    if (res) setSaveStatus('success'); else setSaveStatus('error');
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <div className="bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-[#8BBAFC]/40">
          <div className="flex items-start md:items-center">
            <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
              <FaUserCircle className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">My Profile</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
              <p className="text-white/90 text-xs sm:text-sm mt-1">View and update your personal information and preferences.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar / Summary */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border"
                  onError={() => setPreviewUrl('')}
                />
              ) : (
                placeholderAvatar(form.name)
              )}
              <button
                type="button"
                onClick={openFilePicker}
                className="absolute -bottom-2 -right-2 px-3 py-1.5 text-xs rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
              >
                Change Photo
              </button>
            </div>

            <div className="mt-4">
              <p className="text-gray-900 font-medium">{form.name || '—'}</p>
              <p className="text-gray-500 text-sm">{credentials?.role || authUser?.role || '—'}</p>
              <p className="text-gray-500 text-sm">@{credentials?.username || authUser?.username || '—'}</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile form */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. +1 555 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street, City, Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skillsInput"
                  value={form.skillsInput}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
                <input
                  type="text"
                  name="languagesInput"
                  value={form.languagesInput}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="English, Spanish"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>
            )}
            {saveStatus === 'success' && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">Profile updated successfully.</div>
            )}
            {saveStatus === 'error' && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">Failed to update profile.</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    setForm({
                      name: currentUser.name || '',
                      email: currentUser.email || '',
                      contact_number: currentUser.contact_number || '',
                      address: currentUser.address || '',
                      skillsInput: toCommaString(currentUser.skills),
                      languagesInput: toCommaString(currentUser.preferences?.languages),
                      profileUrl: currentUser.profile_picture?.url || '',
                    });
                    setPreviewUrl(currentUser.profile_picture?.url || '');
                    setSaveStatus(null);
                    clearErrors();
                  }
                }}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cropper Modal */}
      <CropperModal
        isOpen={cropperOpen}
        src={cropSrc}
        onClose={() => setCropperOpen(false)}
        onSave={handleCropSave}
      />
    </div>
  );
};

export default UserProfilePage;
