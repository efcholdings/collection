
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { PDFDownloadLink, usePDF } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import { Artwork } from '@prisma/client';

interface ReportBuilderProps {
    artworks: Artwork[];
    onClose: () => void;
}

const ALL_FIELDS = [
    'Title', 'Artist', 'Date', 'Medium', 'Dimensions', 'Category',
    'Location', 'Appraisal', 'Value', 'Acquired', 'ID', 'Notes'
];

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
};

export default function ReportBuilder({ artworks, onClose }: ReportBuilderProps) {
    const [fields, setFields] = useState<string[]>(ALL_FIELDS);
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(['Title', 'Artist', 'Date', 'Medium', 'Dimensions', 'Appraisal']));
    const [reportTitle, setReportTitle] = useState('');
    const [template, setTemplate] = useState('Standard Inventory List');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const toggleVisibility = (field: string) => {
        const newVisible = new Set(visibleFields);
        if (newVisible.has(field)) {
            newVisible.delete(field);
        } else {
            newVisible.add(field);
        }
        setVisibleFields(newVisible);
    };

    const orderedVisibleFields = fields.filter(f => visibleFields.has(f));

    function SortableRow({ id, isVisible, onToggle }: { id: string, isVisible: boolean, onToggle: () => void }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id });

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
            opacity: isDragging ? 0.3 : 1,
            position: 'relative' as 'relative',
            zIndex: isDragging ? 50 : 'auto',
            touchAction: 'none'
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`flex items-center gap-3 group cursor-pointer py-1 ${isDragging ? 'opacity-50' : ''}`}
            >
                {/* Minimalist Drag Handle - 6 Dots */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move p-2 -ml-2 text-gray-300 hover:text-black transition-colors touch-none flex items-center justify-center opacity-0 group-hover:opacity-100"
                    title="Drag to reorder"
                >
                    <div className="grid grid-cols-2 gap-[3px] w-[8px]">
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                    </div>
                </div>

                {/* Visibility Toggle */}
                <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={onToggle}
                    className="w-3.5 h-3.5 rounded-sm border-gray-300 text-black focus:ring-black focus:ring-offset-0 cursor-pointer"
                />

                {/* Field Name - FORCED STYLE */}
                <span
                    className={`uppercase select-none flex-1 transition-colors ml-[12px] ${isVisible ? 'text-black font-medium' : 'text-gray-400'}`}
                    style={{
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontSize: '12px',
                        letterSpacing: '0.05em',
                        lineHeight: '1.5'
                    }}
                >
                    {id}
                </span>
            </div>
        );
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 !z-[2147483600]" style={{ zIndex: 2147483600 }}>
            {/* Modal Container: Flex Col on mobile, Row on Desktop, Responsive, White, Shadow-2xl */}
            <div
                className="bg-white shadow-2xl flex flex-col md:flex-row items-stretch overflow-y-auto md:overflow-hidden relative w-full h-full md:w-[900px] md:h-[600px] md:max-w-[95vw]"
                style={{ zIndex: 1 }}
            >
                {/* LEFT PANEL: Configuration */}
                <div
                    className="flex-1 flex flex-col gap-[30px] border-b md:border-b-0 md:border-r border-[#E5E7EB] bg-white h-auto md:h-full relative p-8 md:pl-[10%] md:pr-[5%] md:pt-[5%] shrink-0"
                >

                    {/* Report Configuration Title */}
                    <div className="w-full">
                        <h2
                            className="text-black leading-tight"
                            style={{
                                fontFamily: 'var(--font-playfair), serif',
                                fontSize: '32px',
                                fontWeight: 300,
                                letterSpacing: '0.05em'
                            }}
                        >
                            Report Configuration
                        </h2>
                    </div>

                    {/* TOP GROUP: Inputs (Title & Template) */}
                    <div className="flex flex-col gap-8 w-full">
                        {/* Report Title */}
                        <div className="w-full">
                            <label
                                className="block uppercase mb-4"
                                style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '10px',
                                    letterSpacing: '0.4em',
                                    color: '#666666'
                                }}
                            >
                                Report Title
                            </label>
                            <input
                                type="text"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                placeholder="Enter Title..."
                                className="w-full border-b-[0.5px] border-gray-300 py-2 px-0 text-base text-black placeholder:text-gray-300 focus:ring-0 focus:border-black bg-transparent transition-colors"
                                style={{ fontFamily: 'var(--font-playfair), serif' }}
                            />
                        </div>

                        {/* Template Dropdown */}
                        <div className="w-full">
                            <label
                                className="block uppercase mb-4"
                                style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '10px',
                                    letterSpacing: '0.4em',
                                    color: '#666666'
                                }}
                            >
                                Template
                            </label>
                            <div className="relative w-full">
                                <select
                                    value={template}
                                    onChange={(e) => setTemplate(e.target.value)}
                                    className="w-full appearance-none bg-transparent border-b-[0.5px] border-gray-300 text-black text-xs py-2 pr-8 focus:ring-0 focus:border-black cursor-pointer uppercase tracking-wide"
                                    style={{ fontFamily: 'var(--font-inter), sans-serif' }}
                                >
                                    <option>Standard Inventory List</option>
                                    <option>Insurance Appraisal</option>
                                    <option>Shipping Manifest</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM GROUP: Field Selection (Border-T, pt-40) */}
                    <div className="flex-1 flex flex-col border-t border-[#F3F4F6] pt-[40px] overflow-visible md:overflow-hidden">
                        <div className="mb-4">
                            <h3
                                className="uppercase"
                                style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '10px',
                                    letterSpacing: '0.4em',
                                    color: '#666666'
                                }}
                            >
                                Field Selection
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <div className="flex flex-col gap-2 pb-2">
                                    <SortableContext
                                        items={fields}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {fields.map(field => (
                                            <SortableRow
                                                key={field}
                                                id={field}
                                                isVisible={visibleFields.has(field)}
                                                onToggle={() => toggleVisibility(field)}
                                            />
                                        ))}
                                    </SortableContext>
                                </div>

                                {createPortal(
                                    <DragOverlay dropAnimation={dropAnimation} zIndex={2147483647}>
                                        {activeId ? (
                                            <div className="flex items-center gap-6 py-2 px-4 bg-white border border-black shadow-xl w-[300px]">
                                                <input type="checkbox" checked={visibleFields.has(activeId)} readOnly className="w-3.5 h-3.5 rounded-sm border-gray-300 text-black" />
                                                <span
                                                    className="uppercase text-black flex-1 ml-[16px]"
                                                    style={{
                                                        fontFamily: 'var(--font-inter), sans-serif',
                                                        fontSize: '11px',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    {activeId}
                                                </span>
                                            </div>
                                        ) : null}
                                    </DragOverlay>,
                                    document.body
                                )}
                            </DndContext>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Export */}
                <div className="flex-1 flex flex-col items-center justify-center h-auto md:h-full bg-[#FAFAFA] relative p-12 md:p-[60px] shrink-0">

                    <div className="text-center w-full max-w-[320px]">
                        <h3
                            className="text-black mb-1 leading-tight"
                            style={{
                                fontFamily: 'var(--font-playfair), serif',
                                fontSize: '32px',
                                fontWeight: 300,
                                letterSpacing: '0.05em'
                            }}
                        >
                            Ready to Export
                        </h3>

                        <div className="mb-12">
                            <p
                                className="uppercase mb-1"
                                style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '10px',
                                    letterSpacing: '0.4em',
                                    color: '#666666'
                                }}
                            >
                                Summary
                            </p>
                            <p
                                className="text-black"
                                style={{
                                    fontFamily: 'var(--font-inter), sans-serif',
                                    fontSize: '12px',
                                    lineHeight: '1.5'
                                }}
                            >
                                {artworks.length} Artworks • {orderedVisibleFields.length} Columns
                            </p>
                        </div>

                        <div className="flex flex-col items-center w-full">
                            <PreviewButton
                                artworks={artworks}
                                fields={orderedVisibleFields}
                                title={reportTitle || "Collection Report"}
                            />

                            <PDFDownloadLink
                                document={
                                    <ReportDocument
                                        artworks={artworks}
                                        fields={orderedVisibleFields}
                                        title={reportTitle || "Collection Report"}
                                    />
                                }
                                fileName={`${(reportTitle || 'Report').replace(/\s+/g, '_')}.pdf`}
                            >
                                {({ loading }) => (
                                    <button
                                        disabled={loading}
                                        className="w-full max-w-[320px] py-[24px] bg-white border-[1.5px] border-black text-black hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        style={{
                                            fontFamily: 'var(--font-inter), sans-serif',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.6em'
                                        }}
                                    >
                                        {loading ? 'Processing...' : 'Download PDF Catalog'}
                                    </button>
                                )}
                            </PDFDownloadLink>

                            <button
                                onClick={onClose}
                                className="mt-[40px] text-gray-400 font-medium uppercase tracking-[0.2em] border-b border-gray-300 hover:text-black hover:border-black transition-colors pb-0.5"
                                style={{ fontSize: '10px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>,
        document.body
    );
}

function PreviewButton({ artworks, fields, title }: { artworks: Artwork[], fields: string[], title: string }) {
    const [instance] = usePDF({
        document: (
            <ReportDocument
                artworks={artworks}
                fields={fields}
                title={title}
            />
        )
    });

    return (
        <button
            onClick={() => instance.url && window.open(instance.url, '_blank')}
            disabled={instance.loading}
            className="w-full max-w-[320px] py-[24px] bg-white border-[1.5px] border-black text-black hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-[20px]"
            style={{
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.6em'
            }}
        >
            {instance.loading ? 'Preparing Preview...' : 'Preview Report'}
        </button>
    );
}
