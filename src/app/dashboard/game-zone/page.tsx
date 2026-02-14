'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dices, Sparkles, Trophy, Gift, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GameZonePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 md:py-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d97706]/10 border border-[#d97706]/20 text-[#d97706] text-xs font-black uppercase tracking-widest animate-pulse">
          <Sparkles className="h-3 w-3 fill-current" /> Under Construction
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter text-[#2c1810] uppercase">
          Game <span className="text-[#d97706]">Zone</span>
        </h1>
        <p className="text-[#6b584b] text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed px-4">
          We're brewing something special. Daily rewards, interactive quests, and exclusive prizes are coming soon to Steamsbury.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 px-4">
        {[
          { icon: Dices, title: "Spin to Win", desc: "Test your luck daily for a chance to win instant points and free drinks." },
          { icon: Trophy, title: "Trivia Quests", desc: "How well do you know your coffee? Complete challenges to earn rewards." },
          { icon: Gift, title: "Grand Prizes", desc: "Limited edition merchandise and exclusive member-only surprises." }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-xl bg-white/50 backdrop-blur-sm rounded-[2rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-2xl bg-[#d97706]/10 flex items-center justify-center text-[#d97706] mb-4 group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6" />
              </div>
              <CardTitle className="font-headline text-xl uppercase tracking-tight">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#6b584b] leading-relaxed italic">"{item.desc}"</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4">
        <Card className="rounded-[3rem] border-2 border-dashed border-[#d97706]/30 bg-[#d97706]/5 p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d97706]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <Clock className="h-10 w-10 text-[#d97706] animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-headline font-bold text-[#2c1810]">Stay Tuned!</h3>
                    <p className="text-[#6b584b] max-w-md mx-auto leading-relaxed">
                        We are currently fine-tuning the game mechanics to ensure the most rewarding experience for our loyal club members.
                    </p>
                </div>
                <div className="pt-4">
                    <Badge className="bg-[#2c1810] text-white px-6 py-2 rounded-full font-black tracking-widest uppercase text-[10px]">
                        Launching Q3 2024
                    </Badge>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
