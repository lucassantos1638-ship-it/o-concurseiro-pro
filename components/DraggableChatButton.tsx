import React, { useState, useRef, useEffect } from 'react';

interface DraggableChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
    unreadCount: number;
    isPro: boolean;
}

const DraggableChatButton: React.FC<DraggableChatButtonProps> = ({ onClick, isOpen, unreadCount, isPro }) => {
    // Posição inicial (bottom-right com margem)
    const [position, setPosition] = useState({ x: -24, y: -24 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const buttonStartPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    // Inicializa a posição baseada no tamanho da janela para ficar no canto inferior direito
    useEffect(() => {
        const updateInitialPos = () => {
            setPosition({
                x: window.innerWidth - 80, // 80px da direita (considerando largura do botão + margem)
                y: window.innerHeight - 80 // 80px de baixo
            });
        };

        // Apenas define se nunca foi movido (opcional, aqui reseta no resize para garantir visibilidade)
        updateInitialPos();

        window.addEventListener('resize', updateInitialPos);
        return () => window.removeEventListener('resize', updateInitialPos);
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        hasMoved.current = false;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        buttonStartPos.current = { ...position };

        // Captura o ponteiro para garantir que o "up" dispare mesmo se sair do botão
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;

        // Se mover mais que 5px, considera como arraste e não clique
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMoved.current = true;
        }

        let newX = buttonStartPos.current.x + dx;
        let newY = buttonStartPos.current.y + dy;

        // Limites da tela (Bounds)
        const maxX = window.innerWidth - 60; // Largura do botão aprox
        const maxY = window.innerHeight - 60; // Altura do botão aprox

        // Clamping
        newX = Math.max(10, Math.min(newX, maxX));
        newY = Math.max(10, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);

        // Se não moveu significativamente, considera como clique
        if (!hasMoved.current) {
            onClick();
        }
    };

    return (
        <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                touchAction: 'none', // Importante para não rolar a tela enquanto arrasta
                transform: 'translate(0, 0)', // Hardware acceleration
            }}
            className="z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-transform group cursor-move"
        >
            <span className="material-symbols-outlined text-2xl pointer-events-none select-none">
                {isOpen ? 'close' : 'forum'}
            </span>

            {/* Notifier Badge */}
            {!isOpen && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold border-2 border-white animate-pulse pointer-events-none select-none">
                    {unreadCount}
                </span>
            )}

            {/* PRO Badge */}
            {false && ( // Desativado visualmente dentro do componente, controlado por prop se necessário, mas mantendo a lógica limpa
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm border-2 border-white whitespace-nowrap pointer-events-none select-none">
                    PRO
                </span>
            )}
            {!isPro && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm border-2 border-white whitespace-nowrap pointer-events-none select-none">
                    PRO
                </span>
            )}
        </button>
    );
};

export default DraggableChatButton;
