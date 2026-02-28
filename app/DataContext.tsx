import React, { createContext, useReducer, ReactNode } from 'react';

// Define the state shape
export interface DataState {
    rawDataset: any[];
    columns: string[];
    cleanedDataset: any[];
    profiling: {
        types?: Record<string, string>;
        nullPercentages?: Record<string, number>;
        uniqueCounts?: Record<string, number>;
        numericStats?: Record<string, any>;
    };
    cleaningPlan: any[];
    explainability: {
        report?: any;
        summary?: string[];
    };
}

const initialState: DataState = {
    rawDataset: [],
    columns: [],
    cleanedDataset: [],
    profiling: {},
    cleaningPlan: [],
    explainability: {}
};

// Define actions
type Action =
    | { type: 'SET_RAW_DATA'; payload: { data: any[]; columns: string[] } }
    | { type: 'SET_PROFILING'; payload: any }
    | { type: 'SET_CLEANING_PLAN'; payload: any[] }
    | { type: 'SET_CLEANED_DATA'; payload: any[] }
    | { type: 'SET_EXPLAINABILITY'; payload: any }
    | { type: 'RESET' };

const dataReducer = (state: DataState, action: Action): DataState => {
    switch (action.type) {
        case 'SET_RAW_DATA':
            return { ...state, rawDataset: action.payload.data, columns: action.payload.columns };
        case 'SET_PROFILING':
            return { ...state, profiling: action.payload };
        case 'SET_CLEANING_PLAN':
            return { ...state, cleaningPlan: action.payload };
        case 'SET_CLEANED_DATA':
            return { ...state, cleanedDataset: action.payload };
        case 'SET_EXPLAINABILITY':
            return { ...state, explainability: action.payload };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
};

export const DataContext = createContext<{
    state: DataState;
    dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, initialState);

    return (
        <DataContext.Provider value={{ state, dispatch }}>
            {children}
        </DataContext.Provider>
    );
};
