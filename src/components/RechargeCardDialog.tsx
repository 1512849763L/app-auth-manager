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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RechargeCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedCard {
  code: string;
  amount: number;
  expire_at: string | null;
}

export const RechargeCardDialog: React.FC<RechargeCardDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [amount, setAmount] = useState("");
  const [expireAt, setExpireAt] = useState<Date | undefined>();
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCardsMutation = useMutation({
    mutationFn: async ({ amount, expireAt }: { amount: number; expireAt: Date | undefined }) => {
      // Generate recharge card code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_recharge_card_code');
      
      if (codeError) throw codeError;

      // Insert recharge card
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('recharge_cards')
        .insert({
          code: codeData,
          amount,
          created_by: user.id,
          expire_at: expireAt?.toISOString() || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedCards(prev => [...prev, {
        code: data.code,
        amount: data.amount,
        expire_at: data.expire_at
      }]);
      queryClient.invalidateQueries({ queryKey: ['recharge-cards'] });
      toast({
        title: "生成成功",
        description: "充值卡密已生成",
      });
    },
    onError: (error) => {
      toast({
        title: "生成失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "参数错误",
        description: "请输入有效的充值金额",
        variant: "destructive",
      });
      return;
    }

    generateCardsMutation.mutate({ amount: numAmount, expireAt });
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "复制成功",
        description: "卡密已复制到剪贴板",
      });
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制卡密",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setAmount("");
    setExpireAt(undefined);
    setGeneratedCards([]);
    setCopiedCode(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>生成充值卡密</DialogTitle>
          <DialogDescription>
            创建新的充值卡密供用户使用
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">充值金额</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入充值金额"
            />
          </div>

          <div className="space-y-2">
            <Label>过期时间（可选）</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expireAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expireAt ? format(expireAt, "PPP") : "选择过期时间"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expireAt}
                  onSelect={setExpireAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {generatedCards.length > 0 && (
            <div className="space-y-2">
              <Label>已生成的卡密</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {generatedCards.map((card, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{card.code}</div>
                      <div className="text-xs text-muted-foreground">
                        ¥{card.amount} 
                        {card.expire_at && ` • 过期时间: ${format(new Date(card.expire_at), "yyyy-MM-dd")}`}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(card.code)}
                      className="ml-2"
                    >
                      {copiedCode === card.code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={generateCardsMutation.isPending}
          >
            {generateCardsMutation.isPending ? "生成中..." : "生成卡密"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};