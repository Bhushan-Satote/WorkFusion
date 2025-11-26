import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../components/UserDashboard';
import { UserProvider } from '../context/UserContext';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { hasFaceData: true } }),
  },
}));

describe('UserDashboard', () => {
  it('shows attendance actions when face registered', async () => {
    render(
      <BrowserRouter>
        <UserProvider>
          <UserDashboard />
        </UserProvider>
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('Attendance')).toBeInTheDocument());
    expect(screen.getByText('Check In')).toBeInTheDocument();
    expect(screen.getByText('Check Out')).toBeInTheDocument();
  });
});






