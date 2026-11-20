import { OpenCashCard } from '@/components/cash/open-cash-card';
import { ResponsiveSheetContent } from '@/components/responsive-sheet-content';
import {
    Sheet,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

export function OpenCashSheet({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResponsiveSheetContent>
                <SheetHeader className="text-left">
                    <SheetTitle className="display text-3xl">
                        Abrir caja
                    </SheetTitle>
                    <SheetDescription>
                        Indica el efectivo con el que empieza el turno.
                    </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                    <OpenCashCard bare onOpened={() => onOpenChange(false)} />
                </div>
            </ResponsiveSheetContent>
        </Sheet>
    );
}
