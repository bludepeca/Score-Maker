import React from 'react';
import { screen, render, fireEvent, waitFor } from '@testing-library/react-native';
import CriteriaEditorScreen from '../CriteriaEditorScreen';

// Mock DB and Drizzle
jest.mock('../../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${mockUuidCounter++}`,
}));

describe('CriteriaEditorScreen', () => {
  it('renders correctly without crashing', async () => {
    render(<CriteriaEditorScreen route={{}} navigation={{}} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Total de Pesos')).toBeTruthy();
    });
  });
});
