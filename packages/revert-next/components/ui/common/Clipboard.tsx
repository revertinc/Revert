'use client';
import { Icons } from '@revertdotdev/icons';
import { useClipboard } from 'use-clipboard-copy';

type ClipboardProps = {
    value: string;
};
export function Clipboard({ value }: ClipboardProps) {
    const clipboard = useClipboard({
        copiedTimeout: 600,
    });
    return (
        <div className="w-full max-w-[64rem]">
            <div className="relative">
                <input
                    ref={clipboard.target}
                    type="text"
                    className="col-span-6 bg-primary-950 border border-gray-25 text-gray-50/70 text-sm rounded-lg block w-full p-2.5"
                    value={value}
                    disabled
                    readOnly
                />
                <button
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 inline-flex hover:bg-gray-25 items-center justify-center revert-focus-outline"
                    onClick={clipboard.copy}
                >
                    {clipboard.copied ? <Icons.success /> : <Icons.copy />}
                </button>
            </div>
        </div>
    );
}
