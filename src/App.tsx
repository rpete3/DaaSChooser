import * as React from 'react';
import { AppBar, Container, Toolbar, Typography, Card, CardContent, CardHeader, Grid, Checkbox, FormControlLabel, ThemeProvider, createTheme, Button, Box, Divider, Paper } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import personasData from './assets/data/personas.json';
import softwareData from './assets/data/software.json';
import { alpha } from '@mui/material/styles';

// Custom colors for different DaaS types
const daasColors = {
  linux: '#2196f3',    // blue
  vde: '#ff9800',      // orange
  w365: '#4caf50',     // green
};

const theme = createTheme();

interface Persona {
  id: string;
  name: string;
  image: string;
  description: string;
  defaultDaas: string;
}

interface Software {
  id: string;
  name: string;
  category: string;
  daasType: string;
  personas: string[];
}

interface SoftwareData {
  defaultSoftware: Software[];
  optionalSoftware: Software[];
}

interface SoftwareState {
  defaultSoftware: Set<string>;
  optionalSoftware: Set<string>;
}

type SoftwareAction = 
  | { type: 'SET_DEFAULT'; software: string[] }
  | { type: 'TOGGLE_OPTIONAL'; softwareId: string }
  | { type: 'RESET' };

const softwareReducer = (state: SoftwareState, action: SoftwareAction): SoftwareState => {
  switch (action.type) {
    case 'SET_DEFAULT':
      return {
        ...state,
        defaultSoftware: new Set(action.software)
      };
    case 'TOGGLE_OPTIONAL':
      const newOptional = new Set(state.optionalSoftware);
      if (newOptional.has(action.softwareId)) {
        newOptional.delete(action.softwareId);
      } else {
        newOptional.add(action.softwareId);
      }
      return {
        ...state,
        optionalSoftware: newOptional
      };
    case 'RESET':
      return {
        defaultSoftware: new Set(),
        optionalSoftware: new Set()
      };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [selectedPersonas, setSelectedPersonas] = React.useState<Set<string>>(new Set());
  const [softwareState, dispatch] = React.useReducer(softwareReducer, {
    defaultSoftware: new Set<string>(),
    optionalSoftware: new Set<string>()
  });
  const [recommendedDaas, setRecommendedDaas] = React.useState('Linux Software Engineering Environment');

  const personas: Persona[] = personasData;
  const software: SoftwareData = softwareData;
  const currentPersonas = Array.from(selectedPersonas).map(id => personas.find(p => p.id === id)).filter(Boolean) as Persona[];

  const getDaasColor = (daasType: string): string => {
    switch (daasType) {
      case 'Windows VDE':
        return daasColors.vde;
      case 'Windows 365 Cloud Desktop':
        return daasColors.w365;
      default:
        return daasColors.linux;
    }
  };

  // Get selected optional software names
  const getSelectedOptionalSoftware = React.useCallback(() => {
    if (currentPersonas.length === 0) return [];
    return software.optionalSoftware
      .filter(s => 
        softwareState.optionalSoftware.has(s.id) && 
        currentPersonas.some(p => s.personas.includes(p.id))
      )
      .map(s => s.name);
  }, [softwareState.optionalSoftware, software, currentPersonas]);

  const handlePersonaSelect = React.useCallback((personaId: string) => {
    setSelectedPersonas(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(personaId)) {
        newSelection.delete(personaId);
      } else {
        newSelection.add(personaId);
      }
      return newSelection;
    });
    
    // Update default software for all selected personas
    const defaultPersonaSoftware = software.defaultSoftware
      .filter(s => Array.from(selectedPersonas).some(id => s.personas.includes(id)))
      .map(s => s.id);
    
    dispatch({ type: 'SET_DEFAULT', software: defaultPersonaSoftware });
  }, [software, selectedPersonas]);

  const handleReset = React.useCallback(() => {
    setSelectedPersonas(new Set());
    dispatch({ type: 'RESET' });
    setRecommendedDaas('Linux Software Engineering Environment');
  }, []);

  const handleSoftwareChange = React.useCallback((softwareId: string) => {
    dispatch({ type: 'TOGGLE_OPTIONAL', softwareId });
  }, []);

  React.useEffect(() => {
    const selectedItems = [
      ...software.defaultSoftware.filter(s => softwareState.defaultSoftware.has(s.id)),
      ...software.optionalSoftware.filter(s => softwareState.optionalSoftware.has(s.id))
    ];
    
    // Check for persona-based defaults first
    const personaDefaults = currentPersonas.map(p => p.defaultDaas);
    if (personaDefaults.includes('windows-vde')) {
      setRecommendedDaas('Windows VDE');
    } else if (personaDefaults.includes('windows-365')) {
      setRecommendedDaas('Windows 365 Cloud Desktop');
    } else if (personaDefaults.includes('linux-se')) {
      setRecommendedDaas('Linux Software Engineering Environment');
    }
    // Then check software selections if no persona defaults to Windows
    else if (selectedItems.some(s => s.daasType === 'windows-vde')) {
      setRecommendedDaas('Windows VDE');
    } else if (selectedItems.some(s => s.daasType === 'windows-365')) {
      setRecommendedDaas('Windows 365 Cloud Desktop');
    } else {
      setRecommendedDaas('Linux Software Engineering Environment');
    }
  }, [softwareState, software, currentPersonas]);

  const relevantSoftware = React.useMemo(() => {
    if (currentPersonas.length === 0) return [];
    const defaultSoftware = software.defaultSoftware.filter(s => 
      currentPersonas.some(p => s.personas.includes(p.id))
    );
    const optionalSoftware = software.optionalSoftware.filter(s => 
      currentPersonas.some(p => s.personas.includes(p.id))
    );
    return [...defaultSoftware, ...optionalSoftware];
  }, [software, currentPersonas]);

  const categories = React.useMemo(() => 
    Array.from(new Set(relevantSoftware.map(s => s.category))),
    [relevantSoftware]
  );

  const renderSoftwareItem = (software: Software) => {
    const isDefaultSoftware = softwareData.defaultSoftware.some(s => s.id === software.id);
    return (
      <FormControlLabel
        key={software.id}
        control={
          <Checkbox
            checked={isDefaultSoftware 
              ? true  // Always show checked for default software
              : softwareState.optionalSoftware.has(software.id)
            }
            onChange={() => handleSoftwareChange(software.id)}
            disabled={isDefaultSoftware}
          />
        }
        label={
          <Box>
            <Typography 
              sx={{ 
                color: isDefaultSoftware ? 'text.secondary' : 'text.primary'
              }}
            >
              {software.name}
            </Typography>
            {!isDefaultSoftware && (
              <Typography variant="caption" color="text.secondary" display="block">
                Selecting this will change environment to {software.daasType === 'windows-365' ? 'Windows 365' : 'Windows VDE'}
              </Typography>
            )}
          </Box>
        }
      />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>DaaS Chooser</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Reset Choices
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        {/* Recommendation at the top */}
        <Card 
          sx={{ 
            margin: '2rem 0',
            backgroundColor: selectedPersonas.size > 0
              ? alpha(getDaasColor(recommendedDaas), 0.1)
              : 'background.paper'
          }}
        >
          <CardContent>
            <Box>
              {selectedPersonas.size > 0 ? (
                <>
                  <Typography variant="h5" gutterBottom>
                    Based on your answers, the best choice for you is:
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: getDaasColor(recommendedDaas),
                      marginTop: 1,
                      marginBottom: 2
                    }}
                  >
                    {recommendedDaas}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'text.secondary',
                      borderTop: 1,
                      borderColor: 'divider',
                      paddingTop: 2
                    }}
                  >
                    Selected Roles: <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {currentPersonas.map(p => p.name).join(', ')}
                    </Box>
                  </Typography>
                  {getSelectedOptionalSoftware().length > 0 && (
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: 'text.secondary',
                        paddingTop: 1
                      }}
                    >
                      Selected Optional Software: 
                      <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {getSelectedOptionalSoftware().join(', ')}
                      </Box>
                    </Typography>
                  )}
                </>
              ) : (
                <Typography 
                  variant="h5" 
                  align="center" 
                  sx={{ 
                    py: 4,
                    color: 'text.secondary'
                  }}
                >
                  Please choose one or more roles that apply
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ margin: '2rem 0' }} />

        {/* Persona Grid */}
        <Typography variant="h6" gutterBottom>
          Choose all roles that apply:
        </Typography>
        <Grid container spacing={2} sx={{ marginBottom: 4 }}>
          {personas.map(persona => (
            <Grid item xs={12} sm={6} md={3} key={persona.id}>
              <Paper
                elevation={selectedPersonas.has(persona.id) ? 8 : 1}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: selectedPersonas.has(persona.id)
                    ? alpha(getDaasColor(recommendedDaas), 0.15)
                    : 'background.paper',
                  borderLeft: 6,
                  borderColor: selectedPersonas.has(persona.id)
                    ? getDaasColor(recommendedDaas)
                    : 'transparent',
                  '&:hover': {
                    elevation: 4,
                    backgroundColor: selectedPersonas.has(persona.id)
                      ? alpha(getDaasColor(recommendedDaas), 0.15)
                      : 'grey.100'
                  },
                  position: 'relative'
                }}
                onClick={() => handlePersonaSelect(persona.id)}
              >
                {selectedPersonas.has(persona.id) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: getDaasColor(recommendedDaas),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ✓
                  </Box>
                )}
                <Typography variant="h6" gutterBottom>
                  {persona.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {persona.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Software Selection */}
        {currentPersonas.length > 0 && (
          <>
            <Typography variant="h6" sx={{ marginTop: 4, marginBottom: 2 }}>
              Available Software for Selected Roles:
            </Typography>
            <Grid container spacing={2}>
              {categories.map(category => (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <Card>
                    <CardHeader title={category} />
                    <CardContent>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {relevantSoftware
                          .filter(s => s.category === category)
                          .map(renderSoftwareItem)}
      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
