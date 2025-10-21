
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QrCodeGenerator from '../qr-code-generator';

// Mock the onQrGenerated function
const mockOnQrGenerated = jest.fn();

describe('QrCodeGenerator', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockOnQrGenerated.mockClear();
  });

  it('renders the initial form', () => {
    render(<QrCodeGenerator onQrGenerated={mockOnQrGenerated} />);

    // Check if the input field and button are present
    expect(screen.getByLabelText(/product url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate qr code/i })).toBeInTheDocument();
    
    // Check that the QR code is not initially visible
    expect(screen.queryByAltText('Generated QR Code')).not.toBeInTheDocument();
  });

  it('shows an error message for an invalid URL', async () => {
    render(<QrCodeGenerator onQrGenerated={mockOnQrGenerated} />);

    const input = screen.getByLabelText(/product url/i);
    const button = screen.getByRole('button', { name: /generate qr code/i });

    // Simulate user typing an invalid URL
    fireEvent.change(input, { target: { value: 'not-a-valid-url' } });
    fireEvent.click(button);

    // Wait for the error message to appear
    const errorMessage = await screen.findByText(/please enter a valid url/i);
    expect(errorMessage).toBeInTheDocument();
    expect(mockOnQrGenerated).not.toHaveBeenCalled();
  });

  it('generates a QR code when a valid URL is submitted', async () => {
    render(<QrCodeGenerator onQrGenerated={mockOnQrGenerated} />);
    
    const input = screen.getByLabelText(/product url/i);
    const button = screen.getByRole('button', { name: /generate qr code/i });
    const validUrl = 'https://example.com/product/123';

    // Simulate user typing a valid URL and clicking the button
    fireEvent.change(input, { target: { value: validUrl } });
    fireEvent.click(button);

    // Wait for the QR code image to appear
    await waitFor(() => {
      const qrImage = screen.getByAltText('Generated QR Code');
      expect(qrImage).toBeInTheDocument();
      // Check if the image source is correct
      const encodedUrl = encodeURIComponent(validUrl);
      expect(qrImage).toHaveAttribute('src', `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}`);
    });

    // Check if the callback function was called with the correct arguments
    expect(mockOnQrGenerated).toHaveBeenCalledTimes(1);
    const expectedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(validUrl)}`;
    expect(mockOnQrGenerated).toHaveBeenCalledWith(validUrl, expectedQrUrl);

    // Check that the input field is cleared after successful submission
    expect(input).toHaveValue('');
  });
});
