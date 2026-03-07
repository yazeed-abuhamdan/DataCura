import React, { useState } from 'react';

interface VirtualKeyboardProps {
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onClear: () => void;
}

const keysNormal = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

const keysShift = [
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?']
];

export function VirtualKeyboard({ onKeyPress, onBackspace, onClear }: VirtualKeyboardProps) {
    const [isShift, setIsShift] = useState(false);

    const keys = isShift ? keysShift : keysNormal;

    return (
        <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-[500px] z-[50] p-8 bg-[#0B0F19]/95 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center overflow-y-auto">
            <div className="w-full">
                <div className="text-center mb-6 text-xs text-blue-300 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Secure Input Required
                    </div>
                    <span>Physical Keyboard Disabled</span>
                </div>
                <div className="flex flex-col gap-3">
                    {keys.map((row, i) => (
                        <div key={i} className="flex justify-center gap-2">
                            {row.map(key => (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => onKeyPress(key)}
                                    className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg bg-white/10 hover:bg-blue-500/50 text-white font-medium text-lg transition-colors border border-white/5"
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    ))}

                    <div className="flex flex-col gap-2 mt-4">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsShift(!isShift)}
                                className={`flex-1 py-3 rounded-lg font-medium transition-colors border border-white/5 ${isShift ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
                            >
                                SHIFT
                            </button>
                            <button
                                type="button"
                                onClick={onBackspace}
                                className="flex-1 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 font-medium transition-colors border border-red-500/20"
                            >
                                BACKSPACE
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => onKeyPress(' ')}
                            className="w-full py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/5 font-medium tracking-widest"
                        >
                            SPACE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
