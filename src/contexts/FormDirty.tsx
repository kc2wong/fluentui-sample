import React, { createContext, useContext, useRef } from 'react';

interface FormDirtyContextType {
  isDirty: () => boolean;
  markDirty: () => void;
  resetDirty: () => void;
}

const FormDirtyContext = createContext<FormDirtyContextType | undefined>(undefined);

export const FormDirtyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isFormDirty = useRef(false); // Use useRef instead of useState

  const isDirty = () => {
    return isFormDirty.current;
  };

  const markDirty = () => {
    if (!isFormDirty.current) {
      isFormDirty.current = true; // Update the ref directly
    }
  };

  const resetDirty = () => {
    if (isFormDirty.current) {
      isFormDirty.current = false; // Update the ref directly
    }
  };

  return (
    <FormDirtyContext.Provider value={{ isDirty, markDirty, resetDirty }}>
      {children}
    </FormDirtyContext.Provider>
  );
};

export const useFormDirty = (): FormDirtyContextType => {
  const context = useContext(FormDirtyContext);
  if (!context) {
    throw new Error('useFormDirty must be used within a FormDirtyProvider');
  }
  return context;
};
