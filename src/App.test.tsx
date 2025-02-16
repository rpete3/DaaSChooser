import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('DaaS Chooser App', () => {
  it('renders initial state correctly', () => {
    render(<App />);
    
    // Check for app title
    expect(screen.getByText('DaaS Chooser')).toBeInTheDocument();
    
    // Check for initial message
    expect(screen.getByText('Please choose a persona')).toBeInTheDocument();
    
    // Check for reset button
    expect(screen.getByText('Reset Choices')).toBeInTheDocument();
  });

  it('selecting a persona shows software choices', () => {
    render(<App />);
    
    // Find and click a persona
    const javaDevCard = screen.getByText('Java Developer');
    fireEvent.click(javaDevCard);
    
    // Check if recommendation is shown
    expect(screen.getByText('Based on your answers, the best choice for you is:')).toBeInTheDocument();
    expect(screen.getByText('Linux Software Engineering Environment')).toBeInTheDocument();
    
    // Check if software section is shown
    expect(screen.getByText(/Available Software for Java Developer/)).toBeInTheDocument();
  });

  it('reset button clears selection', () => {
    render(<App />);
    
    // Select a persona
    const javaDevCard = screen.getByText('Java Developer');
    fireEvent.click(javaDevCard);
    
    // Click reset
    const resetButton = screen.getByText('Reset Choices');
    fireEvent.click(resetButton);
    
    // Check if back to initial state
    expect(screen.getByText('Please choose a persona')).toBeInTheDocument();
  });

  it('selecting Windows software changes recommendation', () => {
    render(<App />);
    
    // Select a persona that has Windows software options
    const dotNetDevCard = screen.getByText('.NET Developer');
    fireEvent.click(dotNetDevCard);
    
    // Find and click a Windows VDE software option
    // First find the container with the text "Visual Studio"
    const visualStudioText = screen.getByText('Visual Studio');
    // Get the checkbox from the parent FormControlLabel
    const checkbox = visualStudioText.closest('label')?.querySelector('input[type="checkbox"]');
    if (!checkbox) {
      throw new Error('Checkbox not found');
    }
    fireEvent.click(checkbox);
    
    // Check if recommendation changed
    expect(screen.getByText('Windows VDE')).toBeInTheDocument();
  });
}); 