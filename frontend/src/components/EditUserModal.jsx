// import React, { useState, useEffect } from 'react';
// import { useUser } from '../context/UserContext';
// import useUserStore from '../store/userStore';

// const EditUserModal = () => {
//   const { user } = useUser();
//   const { updateUser, isLoading, error } = useUserStore();
  
//   const [formData, setFormData] = useState({
//     contact_number: '',
//     address: '',
//     skills: [],
//     profile_picture: {
//       url: '',
//     },
//     preferences: {
//       languages: [],
//     },
//   });

//   useEffect(() => {
//     if (user) {
//       setFormData({
//         contact_number: user.contact_number || '',
//         address: user.address || '',
//         skills: user.skills || [],
//         profile_picture: {
//           url: user.profile_picture?.url || '',
//         },
//         preferences: {
//           languages: user.preferences?.languages || [],
//         },
//       });
//     }
//   }, [user]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSkillsChange = (e) => {
//     const skills = e.target.value.split(',').map(skill => skill.trim());
//     setFormData(prev => ({
//       ...prev,
//       skills
//     }));
//   };

//   const handleLanguagesChange = (e) => {
//     const languages = e.target.value.split(',').map(lang => lang.trim());
//     setFormData(prev => ({
//       ...prev,
//       preferences: {
//         ...prev.preferences,
//         languages
//       }
//     }));
//   };

//   const handleProfilePictureChange = (e) => {
//     setFormData(prev => ({
//       ...prev,
//       profile_picture: {
//         url: e.target.value,
//       }
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!user?._id) return;
    
//     const success = await updateUser(user._id, formData);
//     if (success) {
//       // Handle successful update
//       console.log('Profile updated successfully');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700">Contact Number</label>
//         <input
//           type="text"
//           name="contact_number"
//           value={formData.contact_number}
//           onChange={handleInputChange}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">Address</label>
//         <input
//           type="text"
//           name="address"
//           value={formData.address}
//           onChange={handleInputChange}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
//         <input
//           type="text"
//           value={formData.skills.join(', ')}
//           onChange={handleSkillsChange}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//           placeholder="React, JavaScript, Node.js"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
//         <input
//           type="url"
//           value={formData.profile_picture.url}
//           onChange={handleProfilePictureChange}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
//         <input
//           type="text"
//           value={formData.preferences.languages.join(', ')}
//           onChange={handleLanguagesChange}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//           placeholder="English, Spanish"
//         />
//       </div>

//       {error && (
//         <div className="text-red-500 text-sm">
//           {error}
//         </div>
//       )}

//       <button
//         type="submit"
//         disabled={isLoading}
//         className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
//       >
//         {isLoading ? 'Updating...' : 'Update Profile'}
//       </button>
//     </form>
//   );
// };

// export default EditUserModal;