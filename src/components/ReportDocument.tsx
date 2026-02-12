
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Artwork } from '@prisma/client';
import { getValidImageUrl } from '@/utils/imageUtils';

// Register fonts - Reverting to standard safe fonts to prevent "Unknown font format" errors
// Font.register({ family: 'Playfair Display', src: '...' });
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 36, // 0.5 inch = 36pt
        fontFamily: 'Helvetica', // Standard Sans-serif
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5',
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontFamily: 'Times-Roman', // Standard Serif
        fontSize: 18,
        color: '#171717',
    },
    headerSubtitle: {
        fontSize: 9,
        color: '#737373',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#F5F5F5',
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    thumbnail: {
        width: 72, // 1 inch
        height: 72, // 1 inch
        backgroundColor: '#F5F5F5',
        marginRight: 18, // 0.25 inch
        objectFit: 'contain',
    },
    thumbnailPlaceholder: {
        width: 72,
        height: 72,
        backgroundColor: '#F5F5F5',
        marginRight: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailText: {
        fontSize: 8,
        color: '#A3A3A3',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    artworkTitle: {
        fontFamily: 'Times-Roman',
        fontSize: 12,
        color: '#171717',
        marginBottom: 4,
    },
    metadataRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metadataItem: {
        flexDirection: 'column',
        marginBottom: 4,
        minWidth: '30%',
    },
    metadataLabel: {
        fontSize: 7,
        color: '#737373',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metadataValue: {
        fontSize: 9,
        color: '#404040',
    },
    footer: {
        position: 'absolute',
        bottom: 36,
        left: 36,
        right: 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5E5',
        paddingTop: 12,
    },
    footerText: {
        fontSize: 8,
        color: '#A3A3A3',
    },
});

interface ReportDocumentProps {
    artworks: Artwork[];
    fields: string[];
    title?: string;
}

export const ReportDocument = ({ artworks, fields, title = 'Collection Report' }: ReportDocumentProps) => {

    // Group fields mapping for display
    const getFieldValue = (artwork: Artwork, field: string) => {
        switch (field) {
            case 'ID': return artwork.originalId;
            case 'Title': return artwork.title;
            case 'Artist': return artwork.artist;
            case 'Date': return artwork.year;
            case 'Medium': return artwork.medium;
            case 'Dimensions': return `${artwork.height || '-'} x ${artwork.width || '-'} x ${artwork.depth || '-'}`;
            case 'Category': return artwork.category;
            case 'Location': return 'Main Gallery'; // Mock
            case 'Appraisal': return artwork.appraisalValue;
            case 'Value': return artwork.purchasePrice;
            case 'Acquired': return new Date(artwork.createdAt).toLocaleDateString();
            case 'Notes': return artwork.notes;
            default: return '';
        }
    };

    return (
        <Document>
            <Page size="LETTER" style={styles.page} wrap>
                {/* Header */}
                <View style={styles.header} fixed>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
                </View>

                {/* Content */}
                {artworks.map((artwork) => {
                    const validImage = getValidImageUrl(artwork.imagePath);

                    // Primary fields (Title/Artist always shown prominently, others based on selection)
                    // Actually, let's respect the `fields` order completely, but keep Title prominent if it's there?
                    // The prompt asked for "List View' format where each row contains a... thumbnail... followed by user's selected fields."
                    // Let's assume Title is always the header of the row if present, or handled in the loop.

                    // Filter fields to exclude Title/Artist if we want to treat them specially, or just map them all.
                    // For a "Gallery-Grade" look, Title and Artist usually have specific hierarchy.
                    // Let's extract Title and Artist for the main row header, and put the rest in grid.
                    // But if the user didn't select them, we shouldn't show them?
                    // Let's assume Title is mandatory for identity, or fall back to ID.

                    const otherFields = fields.filter(f => f !== 'Title' && f !== 'Artist');

                    return (
                        <View key={artwork.id} style={styles.row} wrap={false}>
                            {/* Thumbnail */}
                            {validImage ? (
                                <Image
                                    style={styles.thumbnail}
                                    src={validImage}
                                />
                            ) : (
                                <View style={styles.thumbnailPlaceholder}>
                                    <Text style={styles.thumbnailText}>No Image</Text>
                                </View>
                            )}

                            {/* Data */}
                            <View style={styles.content}>
                                {/* Always show Title/Artist prominently if they are in the selected fields or as default header */}
                                <Text style={styles.artworkTitle}>
                                    {artwork.title}
                                    {fields.includes('Artist') && (
                                        <Text style={{ fontFamily: 'Helvetica', color: '#737373' }}> by {artwork.artist}</Text>
                                    )}
                                </Text>

                                <View style={styles.metadataRow}>
                                    {otherFields.map(field => {
                                        const val = getFieldValue(artwork, field);
                                        if (!val) return null;
                                        return (
                                            <View key={field} style={styles.metadataItem}>
                                                <Text style={styles.metadataLabel}>{field}</Text>
                                                <Text style={styles.metadataValue}>{val}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Internal Collection Management</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
};
