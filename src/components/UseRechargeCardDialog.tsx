import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseRechargeCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UseRechargeCardDialog: React.FC<UseRechargeCardDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [cardCode, setCardCode] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useCardMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .rpc('use_recharge_card', { card_code: code });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      const data = result as { success: boolean; amount?: number; new_balance?: number; message?: string };
      if (data.success) {
        toast({
          title: "充值成功",
          description: `成功充值 ¥${data.amount}，当前余额 ¥${data.new_balance}`,
        });
        queryClient.invalidateQueries({ queryKey: ['balance-records'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        handleClose();
      } else {
        toast({
          title: "充值失败",
          description: data.message || "充值失败",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "充值失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim()) {
      toast({
        title: "参数错误",
        description: "请输入充值卡密",
        variant: "destructive",
      });
      return;
    }

    useCardMutation.mutate(cardCode.trim().toUpperCase());
  };

  const handleClose = () => {
    setCardCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            使用充值卡密
          </DialogTitle>
          <DialogDescription>
            输入充值卡密为账户余额充值
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardCode">充值卡密</Label>
            <Input
              id="cardCode"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              placeholder="请输入充值卡密（如：ABCD-EFGH-IJKL-MNOP-QRST）"
              className="font-mono"
            />
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">使用说明</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 每个卡密只能使用一次</li>
              <li>• 过期的卡密无法使用</li>
              <li>• 充值成功后余额会立即到账</li>
              <li>• 如有问题请联系管理员</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={useCardMutation.isPending}
            >
              {useCardMutation.isPending ? "处理中..." : "确认充值"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};