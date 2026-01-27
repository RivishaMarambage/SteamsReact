'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        console.error('Camera API not supported in this browser.');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Your browser does not support the camera API.',
        });
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
        // Stop camera stream on component unmount
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);

  useEffect(() => {
    if (hasCameraPermission && videoRef.current && 'BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const intervalId = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) { // HAVE_ENOUGH_DATA
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        setScannedData(barcodes[0].rawValue);
                        clearInterval(intervalId); // Stop scanning once a QR code is found
                    }
                } catch (e) {
                    console.error('Barcode detection failed:', e);
                }
            }
        }, 500); // Scan every 500ms

        return () => clearInterval(intervalId);
    }
  }, [hasCameraPermission]);


  return (
    <>
        <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
            <DialogDescription>
                Position the QR code within the frame. Payment details will appear once scanned.
            </DialogDescription>
        </DialogHeader>
        <div className="relative mt-4">
            <video ref={videoRef} className="w-full aspect-square rounded-md bg-muted object-cover" autoPlay muted playsInline />
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                    <CameraOff className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Camera access denied.</p>
                </div>
            )}
            {scannedData && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-md p-4">
                     <Alert variant="default" className="bg-green-100 border-green-300">
                        <AlertTitle className="text-green-800">QR Code Scanned!</AlertTitle>
                        <AlertDescription className="text-green-700 break-all">
                           <p className='font-semibold'>Data:</p> {scannedData}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => setScannedData(null)} className="mt-4">Scan Again</Button>
                </div>
            )}
        </div>
    </>
  );
}
