import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📮</span>
          </div>
          <CardTitle className="text-3xl font-bold text-orange-600">SwiftPost</CardTitle>
          <CardDescription className="text-base">Queue Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Button
            onClick={() => navigate("/book")}
            className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            📋 Book Token
          </Button>
          
          <Button
            onClick={() => navigate("/status")}
            variant="outline"
            className="w-full h-14 text-lg border-orange-300 text-orange-700 hover:bg-orange-50"
            size="lg"
          >
            🔍 Check Token Status
          </Button>
          
          <div className="pt-6 border-t mt-6">
            <p className="text-sm text-gray-500 text-center mb-4">Staff & Admin Access</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/staff")}
                variant="secondary"
                className="h-12"
              >
                👤 Staff Portal
              </Button>
              <Button
                onClick={() => navigate("/admin")}
                variant="secondary"
                className="h-12"
              >
                ⚙️ Admin Panel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-gray-400 mt-6">© 2026 SwiftPost Queue Management</p>
    </div>
  );
}
