
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiService, Token } from "@/lib/api";
import { toast } from "sonner";

export default function TokenStatus() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!tokenInput.trim()) {
      toast.error("Please enter a token number");
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiService.getTokenStatus(tokenInput.trim());
      if (response.success && response.data) {
        setToken(response.data);
        toast.success("Token found!");
      } else {
        toast.error(response.error || "Token not found");
        setToken(null);
      }
    } catch (error: any) {
      let errorMessage = "Failed to check token status. Please try again.";
      
      if (error?.status === 404) {
        errorMessage = `Token "${tokenInput.trim()}" not found. Try tokens like P-001, B-001, or G-001.`;
      } else if (error?.message?.includes('Network error')) {
        errorMessage = "Cannot connect to server. Please check your internet connection or try again later.";
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "Request timed out. The server may be busy, please try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error("Error checking token status:", error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setToken(null);
    setTokenInput("");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'WAITING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⏳' };
      case 'SERVING':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '🔔' };
      case 'COMPLETED':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '✓' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: '?' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-600 mb-1">SwiftPost</h1>
          <p className="text-gray-600">Check Your Token Status</p>
        </div>

        {/* Search Form */}
        {!token && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Token Lookup</CardTitle>
              <CardDescription>Enter your token number to check status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="e.g., P-001, B-002, G-001"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && checkStatus()}
                className="h-12 text-lg text-center font-mono"
              />

              <Button
                onClick={checkStatus}
                disabled={!tokenInput.trim() || loading}
                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Checking...
                  </div>
                ) : (
                  "🔍 Check Status"
                )}
              </Button>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-medium text-orange-800 text-sm mb-2">Token Format Guide</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-orange-700">
                  <div>📦 P = Parcel</div>
                  <div>🏦 B = Banking</div>
                  <div>❓ G = General</div>
                  <div>📄 D = Documents</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Status Display */}
        {token && (
          <Card className="shadow-lg border-2 border-orange-200">
            <CardHeader className="text-center bg-orange-50 rounded-t-lg pb-4">
              <div className="text-sm text-orange-600 font-medium mb-1">Token Number</div>
              <CardTitle className="text-5xl font-bold text-orange-600">
                {token.tokenNumber}
              </CardTitle>
              <CardDescription className="text-base mt-1">{token.serviceType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge className={`${getStatusConfig(token.status).bg} ${getStatusConfig(token.status).text} ${getStatusConfig(token.status).border} px-4 py-2 text-sm`}>
                  {getStatusConfig(token.status).icon} {token.status}
                </Badge>
              </div>

              {/* Waiting Status */}
              {token.status === 'WAITING' && (
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
              )}

              {/* Serving Status */}
              {token.status === 'SERVING' && token.counter && (
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-4xl mb-2">🔔</div>
                  <div className="text-xl font-bold text-green-800">
                    Counter {token.counter}
                  </div>
                  <div className="text-green-600 mt-1">Please proceed now!</div>
                </div>
              )}

              {/* Completed Status */}
              {token.status === 'COMPLETED' && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-lg font-semibold text-gray-800">
                    Service Completed
                  </div>
                  <div className="text-gray-600 mt-1">Thank you for using SwiftPost!</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button onClick={handleNewSearch} variant="outline" className="h-11">
                  Check Another
                </Button>
                <Button onClick={() => navigate("/")} className="h-11 bg-orange-600 hover:bg-orange-700">
                  Home
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
