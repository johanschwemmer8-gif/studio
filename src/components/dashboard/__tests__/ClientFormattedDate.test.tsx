
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientFormattedDate from '../client-formatted-date';

// We need to use fake timers to control the passage of time for useEffect
jest.useFakeTimers();

describe('ClientFormattedDate', () => {
  it('renders a placeholder initially', () => {
    render(<ClientFormattedDate timestamp="2023-10-27T10:00:00Z" />);
    expect(screen.getByText('calculating...')).toBeInTheDocument();
  });

  it('renders the formatted date after hydration', () => {
    const testDate = '2023-10-27T10:00:00Z';
    render(<ClientFormattedDate timestamp={testDate} />);

    // Fast-forward timers to trigger the useEffect hook
    act(() => {
      jest.runAllTimers();
    });

    // The component will format the date based on the test runner's locale.
    // We can create a new Date object here to get the expected format.
    const expectedFormattedDate = new Date(testDate).toLocaleString();
    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();
  });

  it('updates when the timestamp prop changes', () => {
    const initialTimestamp = '2023-10-27T10:00:00Z';
    const { rerender } = render(<ClientFormattedDate timestamp={initialTimestamp} />);

    act(() => {
        jest.runAllTimers();
    });

    const expectedInitialDate = new Date(initialTimestamp).toLocaleString();
    expect(screen.getByText(expectedInitialDate)).toBeInTheDocument();

    const updatedTimestamp = '2024-01-01T12:00:00Z';
    rerender(<ClientFormattedDate timestamp={updatedTimestamp} />);
    
    act(() => {
        jest.runAllTimers();
    });

    const expectedUpdatedDate = new Date(updatedTimestamp).toLocaleString();
    expect(screen.getByText(expectedUpdatedDate)).toBeInTheDocument();
    expect(screen.queryByText(expectedInitialDate)).not.toBeInTheDocument();
  });
});
