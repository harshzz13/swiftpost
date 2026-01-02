import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiService, Token } from "@/lib/api";
import { toast } from "sonner";

const SERVICE_TYPES = [
  { value: "Parcel Drop-off", icon: "📦", description: "Drop off packages and parcels" },
  { value: "Banking Services", icon: "🏦", description: "Banking and financial services" },
  { value: "General Inquiry", icon: "❓", description: "General questions and support" },
  { value: "Document Verification", icon: "📄", description: "Document verification services" }
];

export default function BookToken() {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateToken = async () => {
    if (!service) return;
    
    setLoading(true);
    try {
      const response = await apiService.generateToken(service);
      if (response.success && response.data) {
        setToken(response.data);
        toast.success("Token generated successfully!");
      } else {
        toast.error(response.error || "Failed to generate token");
      }
    } catch (error) {
      toast.error("Failed to generate token. Please try again.");
      console.error("Error generating token:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewToken = () => {
    setToken(null);
    setService("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">SwiftPost</h1>
          <p className="text-gray-600">Book Your Token</p>
        </div>

        {/* Service Selection */}
        {!token && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
              <CardDescription>Choose the service you need assistance with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_TYPES.map((serviceType) => (
                  <button
                    key={serviceType.value}
                    onClick={() => setService(serviceType.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      service === serviceType.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{serviceType.icon}</div>
                    <div className="font-medium text-sm">{serviceType.value}</div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleGenerateToken}
                disabled={!service || loading}
                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Token"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Token Display */}
        {token && (
          <Card className="shadow-lg border-2 border-orange-200">
            <CardHeader className="text-center bg-orange-50 rounded-t-lg">
              <div className="text-sm text-orange-600 font-medium mb-1">Your Token Number</div>
              <CardTitle className="text-5xl font-bold text-orange-600">
                {token.tokenNumber}
              </CardTitle>
              <CardDescription className="text-base">{token.serviceType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">{token.queuePosition}</div>
                  <div className="text-sm text-gray-600">People Ahead</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">{token.estimatedWaitTime}</div>
                  <div className="text-sm text-gray-600">Min Wait</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1">
                  {token.status}
                </Badge>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-sm text-orange-800">
                  Please wait for your token to be called. You can check your status anytime.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleNewToken} variant="outline" className="h-11">
                  New Token
                </Button>
                <Button onClick={() => navigate("/status")} className="h-11 bg-orange-600 hover:bg-orange-700">
                  Check Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!token && (
          <div className="text-center">
            <Button onClick={() => navigate("/")} variant="ghost" className="text-gray-600">
              ← Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
