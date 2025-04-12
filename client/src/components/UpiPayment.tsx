import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, IndianRupee, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UpiPaymentProps {
  startupId: number;
  upiId?: string;
  upiQrCode?: string;
  onSuccess: (transactionId: string, amount: number) => void;
}

export function UpiPayment({ 
  startupId, 
  upiId, 
  upiQrCode, 
  onSuccess 
}: UpiPaymentProps) {
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');

  const startPayment = () => {
    if (!upiId && !upiQrCode) {
      toast({
        title: "UPI Not Available",
        description: "This startup has not provided UPI details for receiving payments.",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to invest.",
        variant: "destructive"
      });
      return;
    }

    // Move to verification step
    setStep('verify');
  };

  const verifyTransaction = () => {
    if (!transactionId) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter the UPI transaction ID to verify your payment.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    // In a real application, you would verify the transaction with a backend service
    // For now, we'll just simulate a successful verification
    setTimeout(() => {
      // Call onSuccess with transaction ID and amount
      onSuccess(transactionId, parseFloat(amount));
      
      toast({
        title: "Transaction Verified",
        description: "Your UPI payment has been recorded successfully.",
      });
      
      // Reset the form
      setAmount('');
      setTransactionId('');
      setStep('initial');
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {!upiId && !upiQrCode && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>UPI Not Available</AlertTitle>
          <AlertDescription>
            This startup has not provided UPI details to receive payments.
          </AlertDescription>
        </Alert>
      )}

      {step === 'initial' ? (
        <div className="space-y-4">
          {upiId && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
              <Label className="text-sm font-medium">UPI ID</Label>
              <div className="mt-1 p-2 bg-white rounded border border-gray-200 text-gray-800">
                {upiId}
              </div>
            </div>
          )}

          {upiQrCode && (
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-sm font-medium">Scan QR Code to Pay</Label>
              <img 
                src={upiQrCode} 
                alt="UPI QR Code" 
                className="w-48 h-48 border border-gray-200 rounded-lg" 
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="5000"
              step="100"
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing || (!upiId && !upiQrCode)}
            />
          </div>

          <Button
            onClick={startPayment}
            disabled={isProcessing || (!upiId && !upiQrCode) || !amount || parseFloat(amount) <= 0}
            className="w-full"
          >
            <IndianRupee className="mr-2 h-4 w-4" />
            Proceed to Pay
          </Button>

          <div className="text-xs text-gray-500 pt-2">
            <p>1. Use your preferred UPI app to make the payment</p>
            <p>2. Send the exact amount mentioned above</p>
            <p>3. Save the transaction ID to verify in the next step</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Verification</AlertTitle>
            <AlertDescription>
              Enter the transaction ID from your UPI payment to complete the investment.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="transactionId">UPI Transaction ID</Label>
            <Input
              id="transactionId"
              placeholder="e.g. 123456789012"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setStep('initial')}
              disabled={isProcessing}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={verifyTransaction}
              disabled={isProcessing || !transactionId}
              className="flex-1"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Verify Payment
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpiPayment;