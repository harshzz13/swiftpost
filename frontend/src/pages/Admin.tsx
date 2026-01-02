import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiService, Counter, QueueStats } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

export default function Admin() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCounterNumber, setNewCounterNumber] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only load data once on mount
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadData();
    }
    
    // Connect to socket only when component mounts
    socket.connect();
    
    // Debounced update functions to prevent rapid-fire requests
    let counterUpdateTimeout: NodeJS.Timeout;
    let statsUpdateTimeout: NodeJS.Timeout;

    const handleCounterUpdate = () => {
      if (hasLoadError) return;
      
      clearTimeout(counterUpdateTimeout);
      counterUpdateTimeout = setTimeout(() => {
        loadCounters();
      }, 2000); // Wait 2 seconds before updating
    };

    const handleStatsUpdate = () => {
      if (hasLoadError) return;
      
      clearTimeout(statsUpdateTimeout);
      statsUpdateTimeout = setTimeout(() => {
        loadStats();
      }, 2000); // Wait 2 seconds before updating
    };

    socket.on('counterAdded', handleCounterUpdate);
    socket.on('counterStatusChanged', handleCounterUpdate);
    socket.on('counterDeleted', handleCounterUpdate);
    socket.on('tokenGenerated', handleStatsUpdate);
    socket.on('tokenCompleted', handleStatsUpdate);

    return () => {
      clearTimeout(counterUpdateTimeout);
      clearTimeout(statsUpdateTimeout);
      socket.off('counterAdded');
      socket.off('counterStatusChanged');
      socket.off('counterDeleted');
      socket.off('tokenGenerated');
      socket.off('tokenCompleted');
      socket.cleanup(); // Use cleanup instead of disconnect
    };
  }, []); // Remove dependencies to prevent re-running

  const loadData = async () => {
    if (loadingRef.current && hasLoadError) return; // Prevent retry if already failed
    
    try {
      await Promise.all([loadStats(), loadCounters()]);
      setHasLoadError(false);
    } catch (error) {
      setHasLoadError(true);
      console.error('Error loading admin data:', error);
    }
  };

  const loadStats = async () => {
    if (hasLoadError) return; // Don't retry if we have errors
    
    try {
      const response = await apiService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setHasLoadError(true);
      
      // Only show toast for non-timeout errors and only once
      if (!error?.message?.includes('timeout') && !error?.message?.includes('slow')) {
        toast.error('Failed to load statistics');
      }
    }
  };

  const loadCounters = async () => {
    if (hasLoadError) return; // Don't retry if we have errors
    
    try {
      const response = await apiService.getCounters();
      if (response.success && response.data) {
        setCounters(response.data);
      }
    } catch (error: any) {
      console.error('Error loading counters:', error);
      setHasLoadError(true);
      
      // Only show toast for non-timeout errors and only once
      if (!error?.message?.includes('timeout') && !error?.message?.includes('slow')) {
        toast.error('Failed to load counters');
      }
    }
  };

  const addCounter = async () => {
    if (!newCounterNumber.trim()) {
      toast.error("Please enter a counter number");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createCounter(parseInt(newCounterNumber));
      if (response.success) {
        toast.success("Counter added successfully");
        setNewCounterNumber("");
        setDialogOpen(false);
        loadCounters();
      } else {
        toast.error(response.error || "Failed to add counter");
      }
    } catch (error) {
      toast.error("Failed to add counter");
      console.error('Error adding counter:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCounterStatus = async (counter: Counter) => {
    const newStatus = counter.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    // Check if trying to deactivate a counter with active tokens
    const hasActiveTokens = counter.tokens && counter.tokens.some(token => token.status === 'SERVING');
    if (newStatus === 'INACTIVE' && hasActiveTokens) {
      toast.error(`Cannot deactivate Counter ${counter.number} - it has a token currently being served. Complete the token first.`, {
        duration: 5000,
      });
      return;
    }
    
    try {
      const response = await apiService.updateCounterStatus(counter.id, newStatus);
      if (response.success) {
        toast.success(`Counter ${counter.number} ${newStatus.toLowerCase()}`);
        loadCounters();
      } else {
        toast.error(response.error || "Failed to update counter");
      }
    } catch (error: any) {
      let errorMessage = "Failed to update counter";
      
      if (error?.message?.includes('active tokens')) {
        errorMessage = `Cannot deactivate Counter ${counter.number} - complete the active token first`;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error('Error updating counter:', error);
    }
  };

  const completeTokenOnCounter = async (counter: Counter) => {
    const activeToken = counter.tokens?.find(token => token.status === 'SERVING');
    if (!activeToken) {
      toast.error("No active token on this counter");
      return;
    }

    try {
      const response = await apiService.completeToken(activeToken.tokenNumber);
      if (response.success) {
        toast.success(`Token ${activeToken.tokenNumber} completed`);
        loadCounters();
        loadStats();
      } else {
        toast.error(response.error || "Failed to complete token");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to complete token");
      console.error('Error completing token:', error);
    }
  };

  const deleteCounter = async (counter: Counter) => {
    // First check if counter has active tokens and warn user
    const hasActiveTokens = counter.tokens && counter.tokens.some(token => token.status === 'SERVING');
    
    let confirmMessage = `Are you sure you want to delete Counter ${counter.number}?`;
    if (hasActiveTokens) {
      confirmMessage = `Counter ${counter.number} may have active tokens. Are you sure you want to delete it? This will fail if tokens are currently being served.`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await apiService.deleteCounter(counter.id);
      if (response.success) {
        toast.success("Counter deleted successfully");
        loadCounters();
      } else {
        toast.error(response.error || "Failed to delete counter");
      }
    } catch (error: any) {
      let errorMessage = "Failed to delete counter";
      
      if (error?.status === 400 && error?.message?.includes('active tokens')) {
        errorMessage = "Cannot delete counter - it has tokens currently being served. Please complete or reassign those tokens first.";
        toast.error(errorMessage, {
          duration: 5000, // Show longer for important messages
        });
      } else if (error?.message?.includes('temporarily unavailable')) {
        errorMessage = "Service temporarily unavailable. Please try again in a moment.";
        toast.error(errorMessage);
      } else if (error?.message) {
        errorMessage = error.message;
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      // Don't log expected business logic errors
      if (!error?.message?.includes('active tokens')) {
        console.error('Error deleting counter:', error);
      }
    }
  };

  const activeCounters = counters.filter(c => c.status === 'ACTIVE');
  const inactiveCounters = counters.filter(c => c.status === 'INACTIVE');

  const handleRetry = () => {
    setHasLoadError(false);
    loadingRef.current = false;
    loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-orange-600 mb-1">SwiftPost</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        {/* Error State */}
        {hasLoadError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-800 font-medium text-sm">
                    Unable to load data - server may be unavailable
                  </span>
                </div>
                <Button 
                  onClick={handleRetry}
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {socket.connectionError && !hasLoadError && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-800 text-sm">
                  Real-time updates unavailable
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Total Tokens Today</CardDescription>
              <CardTitle className="text-4xl text-orange-600">
                {stats?.totalTokensToday || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">In Queue</CardDescription>
              <CardTitle className="text-4xl text-orange-500">
                {stats?.tokensInQueue || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">Avg Wait Time</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                {stats?.averageWaitTime || 0}<span className="text-lg ml-1">min</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Counter Management */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Service Counters</CardTitle>
                <CardDescription>
                  {activeCounters.length} active · {inactiveCounters.length} inactive
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    + Add Counter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Counter</DialogTitle>
                    <DialogDescription>
                      Enter the counter number to create a new service counter.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Counter number (e.g., 5)"
                      value={newCounterNumber}
                      onChange={(e) => setNewCounterNumber(e.target.value)}
                      type="number"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={addCounter}
                        disabled={loading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        {loading ? "Adding..." : "Add Counter"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {counters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No counters configured. Add a counter to get started.
                </div>
              ) : (
                counters.map(counter => {
                  const activeToken = counter.tokens?.find(token => token.status === 'SERVING');
                  const hasActiveToken = !!activeToken;
                  
                  return (
                    <div
                      key={counter.id}
                      className={`p-4 rounded-lg border ${
                        hasActiveToken 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                counter.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                            <span className="font-semibold">Counter {counter.number}</span>
                          </div>
                          <Badge 
                            variant={counter.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {counter.status}
                          </Badge>
                          {hasActiveToken && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                              🎫 {activeToken.tokenNumber}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {hasActiveToken && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs h-8"
                              onClick={() => completeTokenOnCounter(counter)}
                            >
                              ✓ Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => toggleCounterStatus(counter)}
                            disabled={hasActiveToken && counter.status === 'ACTIVE'}
                          >
                            {counter.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-8"
                            onClick={() => deleteCounter(counter)}
                            disabled={hasActiveToken}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      {hasActiveToken && (
                        <div className="mt-2 text-sm text-orange-700">
                          Serving: {activeToken.serviceType}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

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


