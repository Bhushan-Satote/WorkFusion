import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../components/UserDashboard';
import { UserProvider } from '../context/UserContext';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { hasFaceData: false } }),
  },
}));

describe('Face registration gate', () => {
  it('prompts to register face when missing', async () => {
    render(
      <BrowserRouter>
        <UserProvider>
          <UserDashboard />
        </UserProvider>
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText(/Face Registration Required/i)).toBeInTheDocument());
    expect(screen.getByText(/Register Now/i)).toBeInTheDocument();
  });
});






