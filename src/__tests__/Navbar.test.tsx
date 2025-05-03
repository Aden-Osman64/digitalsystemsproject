import { render, screen } from '@testing-library/react';
import { test, expect } from '@jest/globals';
import Navbar from '../components/Navbar';

test('renders the brand name', () => {
  render(<Navbar />);
  expect(screen.getByText(/ClearFund/i)).toBeTruthy();
}); 