"use client";

import { Card } from "@/client/components/ui/Card";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/client/components/ui/Button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <WifiOff className="h-12 w-12 text-orange-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Không có kết nối mạng
                </h1>
                <p className="text-muted-foreground mb-6">
                    Vui lòng kiểm tra kết nối internet và thử lại. 
                    Một số nội dung đã được lưu offline có thể vẫn truy cập được.
                </p>

                <Button 
                    onClick={() => window.location.reload()} 
                    className="w-full"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Thử lại
                </Button>

                <div className="mt-8 pt-6 border-t text-left">
                    <h3 className="font-medium text-foreground mb-3">Bạn có thể:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Xem lại các bài học đã tải
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Ôn tập flashcards đã lưu
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Xem lịch sử học tập gần đây
                        </li>
                    </ul>
                </div>
            </Card>
        </div>
    );
}
