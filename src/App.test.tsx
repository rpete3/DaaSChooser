import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

describe('DaaS Chooser App', () => {
  it('renders initial state correctly', () => {
    render(<App />);
    
    // Check for app title
    expect(screen.getByText('DaaS Chooser')).toBeInTheDocument();
    
    // Check for initial message
    expect(screen.getByText('Please choose one or more roles that apply')).toBeInTheDocument();
    
    // Check for reset button
    expect(screen.getByText('Reset Choices')).toBeInTheDocument();
  });

  it('selecting a persona shows software choices and maintains Linux SE', () => {
    render(<App />);
    
    // Find and click a persona
    const javaDevCard = screen.getByText('Java Developer');
    fireEvent.click(javaDevCard);
    
    // Check if recommendation is shown
    expect(screen.getByText('Based on your answers, the best choice for you is:')).toBeInTheDocument();
    expect(screen.getByText('Linux Software Engineering Environment')).toBeInTheDocument();
    
    // Check if software section is shown
    expect(screen.getByText('Available Software for Selected Roles:')).toBeInTheDocument();
    
    // Verify default software is checked and disabled
    const intellijLabel = screen.getByText('IntelliJ IDEA');
    const labelElement = intellijLabel.closest('label');
    expect(labelElement).not.toBeNull();
    const intellijCheckbox = within(labelElement!).getByRole('checkbox');
    expect(intellijCheckbox).toBeDisabled();
    expect(intellijCheckbox).toBeChecked();
  });

  it('reset button clears all selections', () => {
    render(<App />);
    
    // Select a persona and optional software
    const javaDevCard = screen.getByText('Java Developer');
    fireEvent.click(javaDevCard);
    
    // Wait for and select Tosca software
    const toscaLabel = screen.getByText('Tricentis Tosca');
    const labelElement = toscaLabel.closest('label');
    expect(labelElement).not.toBeNull();
    const toscaCheckbox = within(labelElement!).getByRole('checkbox');
    fireEvent.click(toscaCheckbox);
    
    // Click reset
    const resetButton = screen.getByText('Reset Choices');
    fireEvent.click(resetButton);
    
    // Check if back to initial state
    expect(screen.getByText('Please choose one or more roles that apply')).toBeInTheDocument();
    expect(screen.queryByText('Tricentis Tosca')).not.toBeInTheDocument();
  });

  it('selecting Windows VDE software overrides Windows 365', () => {
    render(<App />);
    
    // Select a non-dev persona (defaults to Windows 365)
    const nonDevCard = screen.getByText('Non-Developer');
    fireEvent.click(nonDevCard);
    
    // Verify initial Windows 365 recommendation
    expect(screen.getByText('Windows 365 Cloud Desktop')).toBeInTheDocument();
    
    // Add a Data Scientist (defaults to Linux)
    const dataScientistCard = screen.getByText('Data Scientist');
    fireEvent.click(dataScientistCard);
    
    // Select SSMS (Windows VDE software)
    const ssmsLabel = screen.getByText('SQL Server Management Studio');
    const labelElement = ssmsLabel.closest('label');
    expect(labelElement).not.toBeNull();
    const ssmsCheckbox = within(labelElement!).getByRole('checkbox');
    fireEvent.click(ssmsCheckbox);
    
    // Verify Windows VDE takes precedence
    expect(screen.getByText('Windows VDE')).toBeInTheDocument();
  });

  it('deselecting a persona cleans up its software selections', () => {
    render(<App />);
    
    // Select Data Scientist
    const dataScientistCard = screen.getByText('Data Scientist');
    fireEvent.click(dataScientistCard);
    
    // Select Power BI (Windows 365 software)
    const powerBiLabel = screen.getByText('Power BI Desktop');
    const labelElement = powerBiLabel.closest('label');
    expect(labelElement).not.toBeNull();
    const powerBiCheckbox = within(labelElement!).getByRole('checkbox');
    fireEvent.click(powerBiCheckbox);
    
    // Verify Windows 365 is recommended
    expect(screen.getByText('Windows 365 Cloud Desktop')).toBeInTheDocument();
    
    // Deselect Data Scientist
    fireEvent.click(dataScientistCard);
    
    // Verify back to Linux SE and Power BI option is gone
    expect(screen.getByText('Please choose one or more roles that apply')).toBeInTheDocument();
    expect(screen.queryByText('Power BI Desktop')).not.toBeInTheDocument();
  });

  it('handles multiple persona selection with conflicting DaaS types', () => {
    render(<App />);
    
    // Select .NET Developer (defaults to Windows VDE)
    const dotNetDevCard = screen.getByText('.NET Developer');
    fireEvent.click(dotNetDevCard);
    
    // Verify Windows VDE
    expect(screen.getByText('Windows VDE')).toBeInTheDocument();
    
    // Add Non-Developer (defaults to Windows 365)
    const nonDevCard = screen.getByText('Non-Developer');
    fireEvent.click(nonDevCard);
    
    // Verify Windows VDE is maintained (VDE > 365)
    expect(screen.getByText('Windows VDE')).toBeInTheDocument();
    
    // Add Java Developer (defaults to Linux)
    const javaDevCard = screen.getByText('Java Developer');
    fireEvent.click(javaDevCard);
    
    // Verify Windows VDE is still maintained
    expect(screen.getByText('Windows VDE')).toBeInTheDocument();
  });

  it('provision button opens correct URL', () => {
    // Mock window.open
    const openMock = vi.fn();
    vi.stubGlobal('open', openMock);
    
    render(<App />);
    
    // Select .NET Developer
    const dotNetDevCard = screen.getByText('.NET Developer');
    fireEvent.click(dotNetDevCard);
    
    // Click provision button
    const provisionButton = screen.getByText('Provision Now');
    fireEvent.click(provisionButton);
    
    // Verify correct URL was opened
    expect(openMock).toHaveBeenCalledWith('https://provision.windows-vde.example.com', '_blank');
    
    // Cleanup
    vi.unstubAllGlobals();
  });

  it('shows environment change message only in development mode', () => {
    // Mock development mode
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;
    
    render(<App />);
    
    // Find the Data Scientist card by looking for the heading within a Paper component
    const dataScientistHeading = screen.getAllByRole('heading', { name: 'Data Scientist' })[0];
    const dataScientistCard = dataScientistHeading.closest('.MuiPaper-root');
    expect(dataScientistCard).not.toBeNull();
    fireEvent.click(dataScientistCard!);
    
    // Find SSMS option
    const ssmsLabel = screen.getByText('SQL Server Management Studio');
    expect(ssmsLabel).toBeInTheDocument();
    
    // The environment change message should be visible
    // First find all software items that would show the VDE message
    const vdeMessages = screen.getAllByText('Selecting this will change environment to Windows VDE');
    expect(vdeMessages.length).toBeGreaterThan(0);
    
    // At least one message should be near the SSMS option
    const ssmsFormControl = ssmsLabel.closest('label');
    expect(ssmsFormControl).not.toBeNull();
    const ssmsCard = ssmsFormControl!.closest('.MuiCard-root');
    expect(ssmsCard).not.toBeNull();
    expect(ssmsCard!.textContent).toContain('SQL Server Management Studio');
    expect(ssmsCard!.textContent).toContain('Selecting this will change environment to Windows VDE');
    
    // Verify the message is not shown in production mode
    import.meta.env.DEV = false;
    const { container } = render(<App />);
    
    // Select Data Scientist again in the new render
    const dataScientistHeading2 = screen.getAllByRole('heading', { name: 'Data Scientist' })[0];
    const dataScientistCard2 = dataScientistHeading2.closest('.MuiPaper-root');
    expect(dataScientistCard2).not.toBeNull();
    fireEvent.click(dataScientistCard2!);
    
    // The environment change message should not be present
    expect(screen.queryByText('Selecting this will change environment to Windows VDE')).not.toBeInTheDocument();
    
    // Cleanup
    import.meta.env.DEV = originalEnv;
  });
}); 