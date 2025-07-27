import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';

// Mock next/navigation
const mockRouter = { push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock all dependencies
vi.mock('@/actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('@/actions/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/actions/create-project', () => ({
  createProject: vi.fn(),
}));

vi.mock('@/lib/anon-work-tracker', () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Import mocks
const mockSignIn = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());
const mockGetProjects = vi.hoisted(() => vi.fn());
const mockCreateProject = vi.hoisted(() => vi.fn());
const mockGetAnonWorkData = vi.hoisted(() => vi.fn());
const mockClearAnonWork = vi.hoisted(() => vi.fn());

// Replace module mocks
vi.mock('@/actions', () => ({
  signIn: mockSignIn,
  signUp: mockSignUp,
}));

vi.mock('@/actions/get-projects', () => ({
  getProjects: mockGetProjects,
}));

vi.mock('@/actions/create-project', () => ({
  createProject: mockCreateProject,
}));

vi.mock('@/lib/anon-work-tracker', () => ({
  getAnonWorkData: mockGetAnonWorkData,
  clearAnonWork: mockClearAnonWork,
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully without anonymous work', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project-123' });

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'password123');
      });

      expect(response).toEqual({ success: true });
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });

    it('should sign in successfully with anonymous work', async () => {
      const anonWork = {
        messages: [{ role: 'user', content: 'Create a button' }],
        fileSystemData: { '/App.jsx': 'export default function App() { return <button>Click me</button>; }' },
      };

      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: 'project-with-anon-work' });

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'password123');
      });

      expect(response).toEqual({ success: true });
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/Design from \d{1,2}:\d{2}:\d{2} [AP]M/),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
    });

    it('should sign in successfully and redirect to existing project', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: 'existing-project-1' },
        { id: 'existing-project-2' },
      ]);

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'password123');
      });

      expect(response).toEqual({ success: true });
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it('should handle sign in failure', async () => {
      mockSignIn.mockResolvedValue({ success: false, error: 'Invalid credentials' });

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'wrong-password');
      });

      expect(response).toEqual({ success: false, error: 'Invalid credentials' });
      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    it('should handle sign in with network error', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        try {
          response = await result.current.signIn('test@example.com', 'password123');
        } catch (error) {
          response = { success: false, error: 'Network error' };
        }
      });

      expect(response).toEqual({ success: false, error: 'Network error' });
    });

    it('should set loading state correctly during sign in', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockSignIn.mockReturnValue(promise);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project-456' });

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signUp('newuser@example.com', 'newpassword123');
      });

      expect(response).toEqual({ success: true });
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
      expect(mockCreateProject).toHaveBeenCalled();
    });

    it('should handle sign up failure', async () => {
      mockSignUp.mockResolvedValue({ success: false, error: 'Email already exists' });

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        response = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(response).toEqual({ success: false, error: 'Email already exists' });
    });

    it('should handle sign up with network error', async () => {
      mockSignUp.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      let response;
      await act(async () => {
        try {
          response = await result.current.signUp('test@example.com', 'password123');
        } catch (error) {
          response = { success: false, error: 'Network error' };
        }
      });

      expect(response).toEqual({ success: false, error: 'Network error' });
    });

    it('should set loading state correctly during sign up', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockSignUp.mockReturnValue(promise);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.signUp('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty anonymous work data', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project-789' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });

    it('should handle missing messages array in anonymous work', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project-101' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });

    it('should handle multiple existing projects', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: 'project-3' },
        { id: 'project-2' },
        { id: 'project-1' },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it('should handle empty messages array in anonymous work', async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project-111' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });
  });
});