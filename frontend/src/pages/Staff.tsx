import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService, Token, Counter } from "@/lib/api";
import { toast } from "sonner";

export default function Staff() {
  const navigate = useNavigate();
  const [waitingTokens, setWaitingTokens] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only load data once on mount
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([loadWaitingTokens(), loadCounters()]);
      setHasLoadError(false);
    } catch (error) {
      setHasLoadError(true);
      console.error('Error loading staff data:', error);
    }
  };

  const loadCounters = async () => {
    try {
      const response = await apiService.getCounters();
      if (response.success && response.data) {
        const activeCounters = response.data.filter(c => c.status === 'ACTIVE');
        setCounters(activeCounters);
        
        // Auto-select first active counter if none selected
        if (!selectedCounterId && activeCounters.length > 0) {
          setSelectedCounterId(activeCounters[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error loading counters:', error);
      setHasLoadError(true);
      
      if (!error?.message?.includes('timeout') && !error?.message?.includes('slow')) {
        toast.error('Failed to load counters');
      }
    }
  };

  const loadWaitingTokens = async () => {
    if (hasLoadError) return;
    
    try {
      const response = await apiService.getWaitingTokens();
      if (response.success && response.data) {
        setWaitingTokens(response.data);
        setHasLoadError(false);
      }
    } catch (error: any) {
      console.error('Error loading waiting tokens:', error);
      setHasLoadError(true);
      
      if (!error?.message?.includes('timeout') && !error?.message?.includes('slow')) {
        toast.error('Failed to load waiting tokens');
      }
    }
  };

  const callNextToken = async () => {
    if (!selectedCounterId) {
      toast.error("Please select a counter first");
      return;
    }

    if (currentToken) {
      toast.error("Please complete the current token first");
      return;
    }

    // Check if there are any waiting tokens before making the API call
    if (waitingTokens.length === 0) {
      toast.error("No tokens are currently waiting in the queue");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.callNextToken(selectedCounterId);
      if (response.success && response.data) {
        setCurrentToken(response.data);
        toast.success(`Called token ${response.data.tokenNumber}`);
        loadWaitingTokens(); // Refresh the queue
      } else {
        toast.error(response.error || "No tokens in queue");
      }
    } catch (error: any) {
      let errorMessage = "Failed to call next token";
      
      if (error?.status === 404) {
        errorMessage = "No tokens are currently waiting in the queue";
      } else if (error?.message?.includes('temporarily unavailable')) {
        errorMessage = "Service temporarily unavailable. Please try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error('Error calling next token:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeToken = async () => {
    if (!currentToken) return;

    setLoading(true);
    try {
      const response = await apiService.completeToken(currentToken.tokenNumber);
      if (response.success) {
        setCurrentToken(null);
        toast.success("Token completed successfully");
        loadWaitingTokens(); // Refresh the queue
      } else {
        toast.error(response.error || "Failed to complete token");
      }
    } catch (error: any) {
      let errorMessage = "Failed to complete token";
      
      if (error?.message?.includes('temporarily unavailable')) {
        errorMessage = "Service temporarily unavailable. Please try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error('Error completing token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setHasLoadError(false);
    loadingRef.current = false;
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="shadow-sm border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold text-orange-600">SwiftPost</CardTitle>
            <CardDescription>Staff Interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Counter Selection */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <label className="text-sm font-medium text-gray-700">Your Counter:</label>
              <Select 
                value={selectedCounterId?.toString() || ""} 
                onValueChange={(value) => setSelectedCounterId(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select counter" />
                </SelectTrigger>
                <SelectContent>
                  {counters.map((counter) => (
                    <SelectItem key={counter.id} value={counter.id.toString()}>
                      Counter {counter.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error State */}
            {hasLoadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-800 font-medium text-sm">
                      Server unavailable
                    </span>
                  </div>
                  <Button 
                    onClick={handleRetry}
                    variant="outline" 
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 h-8"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Call Next Button */}
            <div className="text-center">
              <Button
                onClick={callNextToken}
                disabled={loading || currentToken !== null || !selectedCounterId || hasLoadError || waitingTokens.length === 0}
                size="lg"
                className="h-14 px-12 text-lg bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Calling...
                  </div>
                ) : waitingTokens.length === 0 ? (
                  "No Tokens Available"
                ) : (
                  "📢 Call Next Token"
                )}
              </Button>
              {waitingTokens.length === 0 && !hasLoadError && !currentToken && (
                <p className="text-sm text-gray-500 mt-2">
                  Queue is empty - waiting for customers
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Token */}
          <Card className={`shadow-sm ${currentToken ? 'border-2 border-orange-300' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Now Serving</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {currentToken ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-xl p-6">
                    <div className="text-5xl font-bold text-orange-600 mb-2">
                      {currentToken.tokenNumber}
                    </div>
                    <div className="text-gray-600">{currentToken.serviceType}</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-1">
                    SERVING
                  </Badge>
                  <Button
                    onClick={completeToken}
                    disabled={loading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
                  >
                    {loading ? "Completing..." : "✓ Complete Service"}
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-gray-400">
                  <div className="text-4xl mb-2">🎫</div>
                  <p>No token being served</p>
                  <p className="text-sm">Click "Call Next Token" to begin</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Waiting Queue</CardTitle>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {waitingTokens.length} waiting
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {waitingTokens.length > 0 ? (
                  waitingTokens.slice(0, 10).map((token, index) => (
                    <div
                      key={token.tokenNumber}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        index === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${index === 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {token.tokenNumber}
                        </span>
                        <span className="text-sm text-gray-500">
                          {token.serviceType}
                        </span>
                      </div>
                      <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p>No tokens waiting</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="text-center pb-4">
          <Button onClick={() => navigate("/")} variant="ghost" className="text-gray-600">
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}


