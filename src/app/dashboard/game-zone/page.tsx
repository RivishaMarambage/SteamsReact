'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, updateDoc, increment, collection, onSnapshot, runTransaction, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { Trophy, Coins, Lock, Sparkles, Dices, Coffee, Ticket, RotateCcw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { UserProfile, GameProfile, DailyGameWinners } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// --- CONSTANTS ---
const TRIVIA_DAILY_LIMIT = 5;
const TRIVIA_QUEST_GOAL = 5;
const SPIN_COST = 10;

const QUESTION_BANK = [
  { category: 'Ancient History', q: 'Which king made Sigiriya his capital in the 5th century AD?', options: ['King Kashyapa', 'King Parakramabahu', 'King Dutugemunu', 'King Devanampiya Tissa'], correct: 0, fact: "King Kashyapa built his palace on the summit of Sigiriya rock." },
  { category: 'Tea & Coffee', q: 'Who first planted coffee in Sri Lanka on a commercial scale?', options: ['The Portuguese', 'The Dutch', 'The British', 'The Kandyans'], correct: 1, fact: 'The Dutch were the first to attempt commercial coffee cultivation.' },
  { category: 'Culture', q: 'The Temple of the Tooth in Kandy holds a relic of whom?', options: ['Shiva', 'Vishnu', 'The Buddha', 'Ganesha'], correct: 2, fact: 'The Sacred Tooth Relic is one of the most revered objects in Buddhism.' },
  { category: 'Geography', q: 'What is the highest mountain in Sri Lanka?', options: ['Adam\'s Peak', 'Pidurutalagala', 'Knuckles Range', 'Horton Plains'], correct: 1, fact: 'Pidurutalagala stands at 2,524 meters.' },
  { category: 'Nature', q: 'Which national park is most famous for its leopard population?', options: ['Wilpattu', 'Yala', 'Udawalawe', 'Kumana'], correct: 1, fact: 'Yala National Park has one of the highest leopard densities in the world.' },
  { category: 'Food', q: 'What is the base ingredient of "Hoppers" (Appa)?', options: ['Wheat flour', 'Rice flour & coconut milk', 'Gram flour', 'Manioc'], correct: 1, fact: 'Hoppers are made from a fermented batter of rice flour and coconut milk.' },
  { category: 'History', q: 'In which city was the last kingdom of Sri Lanka located?', options: ['Anuradhapura', 'Polonnaruwa', 'Kandy', 'Galle'], correct: 2, fact: 'Kandy was the last independent monarchy of Sri Lanka.' }
];


function GameZonePageContent() {
  const { user: authUser, isUserLoading: authLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeGame, setActiveGame] = useState('spin');
  
  // Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{ type: string; val: string } | null>(null);

  // Scratch State
  const [isScratching, setIsScratching] = useState(false);
  const [scratchResult, setScratchResult] = useState<string | null>(null);

  // Trivia State
  const [triviaProgress, setTriviaProgress] = useState(0);
  const [currentTrivia, setCurrentTrivia] = useState<(typeof QUESTION_BANK)[0] | null>(null);
  const [triviaFeedback, setTriviaFeedback] = useState<{ correct: boolean; text: string; reset?: boolean } | null>(null);
  
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const gameProfileRef = useMemoFirebase(() => authUser ? doc(firestore, `users/${authUser.uid}/data/game_profile`) : null, [authUser, firestore]);
  const { data: gameProfile, isLoading: gameProfileLoading } = useDoc<GameProfile>(gameProfileRef);

  const globalWinnersRef = useMemoFirebase(() => doc(firestore, 'daily_game_winners', today), [firestore, today]);
  const { data: globalWinners, isLoading: winnersLoading } = useDoc<DailyGameWinners>(globalWinnersRef);


  useEffect(() => {
    const defaultProfile = { lastPlayedDate: today, triviaCount: 0, spinCount: 0 };
    // Initialize game profile on first load for a new day
    if (gameProfileRef && gameProfile && gameProfile.lastPlayedDate !== today) {
        updateDoc(gameProfileRef, defaultProfile);
    } else if (gameProfileRef && !gameProfile && !gameProfileLoading && authUser) {
        setDoc(gameProfileRef, defaultProfile);
    }
  }, [gameProfile, gameProfileRef, gameProfileLoading, today, authUser]);

  const isLoading = authLoading || profileLoading || gameProfileLoading || winnersLoading;
  
  const updatePoints = async (amount: number, desc: string) => {
    if (!authUser || !firestore || !userProfileRef) return;
    const batch = writeBatch(firestore);
    batch.update(userProfileRef, { 
      loyaltyPoints: increment(amount),
      lifetimePoints: increment(amount > 0 ? amount : 0) 
    });
    const transactionRef = doc(collection(firestore, `users/${authUser.uid}/point_transactions`));
    batch.set(transactionRef, {
      date: serverTimestamp(),
      description: desc,
      amount: amount,
      type: amount > 0 ? 'earn' : 'redeem',
    });
    await batch.commit().catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: userProfileRef.path, operation: 'update', requestResourceData: {loyaltyPoints: increment(amount)}}));
    });
  };

  const handleGrandWin = async (gameKey: keyof DailyGameWinners, prizeName: string) => {
    if (!authUser || !globalWinnersRef || !userProfileRef) return false;

    try {
      await runTransaction(firestore, async (transaction) => {
        const globalSnap = await transaction.get(globalWinnersRef);
        
        if (!globalSnap.exists()) {
             transaction.set(globalWinnersRef, { spinWinner: null, scratchWinner: null, triviaWinner: null });
        }
        
        const winners = globalSnap.data() as DailyGameWinners | undefined ?? { spinWinner: null, scratchWinner: null, triviaWinner: null };

        if (winners[gameKey]) throw new Error("Taken");
        
        transaction.update(globalWinnersRef, { [gameKey]: authUser.uid });
        transaction.update(userProfileRef, { loyaltyPoints: increment(50) });
      });
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // --- SPIN LOGIC ---
  const playSpin = async () => {
    if (isSpinning || !authUser || !userProfile || !gameProfile || !gameProfileRef) return;

    const isFreeSpin = (gameProfile.spinCount ?? 0) === 0;

    if (!isFreeSpin) {
        if ((userProfile.loyaltyPoints ?? 0) < SPIN_COST) {
            toast({
                variant: 'destructive',
                title: 'Not enough points',
                description: `You need ${SPIN_COST} points for another spin.`,
            });
            return;
        }
    }

    setIsSpinning(true);
    setSpinResult(null);

    if (!isFreeSpin) {
        await updatePoints(-SPIN_COST, "Paid Spin to Win");
    }

    await updateDoc(gameProfileRef, { spinCount: increment(1) });

    await new Promise(r => setTimeout(r, 2000));

    const rng = Math.random();
    if (rng < 0.05 && !globalWinners?.spinWinner) {
      const won = await handleGrandWin('spinWinner', 'Free Coffee');
      if (won) {
          setSpinResult({ type: 'GRAND', val: 'FREE COFFEE' });
      } else { 
          setSpinResult({ type: 'LOSE', val: 'TRY AGAIN' });
      }
    } else if (rng < 0.3) {
      const pts = Math.floor(Math.random() * 5) + 1;
      await updatePoints(pts, "Lucky Spin Win");
      setSpinResult({ type: 'POINTS', val: `${pts} PTS` });
    } else {
      setSpinResult({ type: 'LOSE', val: 'TRY AGAIN' });
    }
    setIsSpinning(false);
  };
  
  // --- SCRATCH LOGIC ---
  const playScratch = async () => {
    if (isScratching || !authUser) return;
    
    setIsScratching(true);
    setScratchResult(null);

    // Simulate scratching delay for tactile feel
    await new Promise(r => setTimeout(r, 1500));

    const rng = Math.random();
    
    // 3% chance for grand prize
    if (rng < 0.03 && !globalWinners?.scratchWinner) {
      const won = await handleGrandWin('scratchWinner', 'Club Sandwich');
      if (won) {
          setScratchResult("GRAND PRIZE: CLUB SANDWICH!");
          setIsScratching(false);
          return;
      }
    }
    
    // 50% chance for consolation points
    if (Math.random() > 0.5) {
      await updatePoints(2, "Scratch Consolation");
      setScratchResult("YOU WON 2 PTS!");
    } else {
      setScratchResult("BETTER LUCK NEXT TIME!");
    }
    setIsScratching(false);
  };

  // --- TRIVIA LOGIC ---
  const startTrivia = () => {
    if ((gameProfile?.triviaCount ?? 0) >= TRIVIA_DAILY_LIMIT) setActiveGame('trivia_limit');
    else {
      getNextQuestion();
      setActiveGame('trivia');
    }
  };

  const getNextQuestion = () => {
    // Avoid picking the exact same question twice in a row
    let nextQ;
    do {
      nextQ = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
    } while (nextQ.q === currentTrivia?.q && QUESTION_BANK.length > 1);
    
    setCurrentTrivia(nextQ);
    setTriviaFeedback(null);
  };

  const handleTriviaAnswer = async (idx: number) => {
    if (!currentTrivia || !authUser || !gameProfileRef) return;
    const isCorrect = idx === currentTrivia.correct;

    if (isCorrect) {
      const nextProgress = triviaProgress + 1;
      await updateDoc(gameProfileRef, { triviaCount: increment(1) });

      if (nextProgress >= TRIVIA_QUEST_GOAL) {
        setTriviaProgress(0);
        const won = !globalWinners?.triviaWinner 
          ? await handleGrandWin('triviaWinner', '40% Discount') 
          : false;
        
        if (!won) await updatePoints(10, 'Trivia Master');
        setTriviaFeedback({ correct: true, text: won ? "QUEST COMPLETE: GRAND PRIZE!" : "QUEST COMPLETE: 10 PTS", reset: true });
      } else {
        setTriviaProgress(nextProgress);
        setTriviaFeedback({ correct: true, text: `Correct! (${nextProgress}/${TRIVIA_QUEST_GOAL})` });
      }
    } else {
      setTriviaFeedback({ correct: false, text: "Incorrect! Better luck with the next one." });
    }
  };

  if (isLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-96 w-full" />
          </div>
      )
  }
  
  if (!userProfile) return <p>Could not load user profile.</p>;

  const hasFreeSpin = (gameProfile?.spinCount ?? 0) === 0;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">GAME ZONE</h1>
            <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-widest">Win Daily Rewards</p>
          </div>
          <div className="bg-background/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
            <Coins size={16} className="text-amber-300" />
            <span className="font-bold text-sm">{userProfile.loyaltyPoints}</span>
          </div>
        </div>
      </Card>

      <div className="flex bg-muted p-1 rounded-2xl">
        <button 
          onClick={() => setActiveGame('spin')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeGame === 'spin' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
        >
          <Dices size={18} /> Spin
        </button>
        <button 
          onClick={() => setActiveGame('scratch')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeGame === 'scratch' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
        >
          <Ticket size={18} /> Scratch
        </button>
        <button 
          onClick={startTrivia}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeGame.includes('trivia') ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
        >
          <Trophy size={18} /> Trivia
        </button>
      </div>

      {/* SPIN GAME */}
      {activeGame === 'spin' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card className="p-8 text-center space-y-6">
            <div className="relative mx-auto w-48 h-48">
              <div 
                className={`w-full h-full rounded-full border-8 border-muted/50 dark:border-zinc-800 relative flex items-center justify-center transition-transform duration-[2000ms] ease-out ${isSpinning ? 'rotate-[1080deg]' : 'rotate-0'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)' }}
              >
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rotate-45">
                  <div className="border border-muted dark:border-zinc-800 flex items-center justify-center bg-background/50 dark:bg-zinc-900"><RotateCcw size={16} className="opacity-20"/></div>
                  <div className="border border-muted dark:border-zinc-800 flex items-center justify-center bg-primary/10 dark:bg-blue-900/20"><Coins size={16} className="text-primary/60 opacity-40"/></div>
                  <div className="border border-muted dark:border-zinc-800 flex items-center justify-center bg-background/50 dark:bg-zinc-900"><RotateCcw size={16} className="opacity-20"/></div>
                  <div className={`border border-muted dark:border-zinc-800 flex items-center justify-center ${globalWinners?.spinWinner ? 'bg-muted' : 'bg-green-100 text-green-600'}`}>
                    {globalWinners?.spinWinner ? <Lock size={16} /> : <Coffee size={16} />}
                  </div>
                </div>
                <div className="w-4 h-4 bg-foreground rounded-full z-10 border-2 border-background shadow-lg" />
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-red-500 z-20" />
            </div>

            {spinResult && (
              <div className="animate-bounce">
                <p className={`text-xl font-black ${spinResult.type === 'LOSE' ? 'text-muted-foreground' : 'text-primary'}`}>
                  {spinResult.val}
                </p>
              </div>
            )}

            <Button size="lg" className="w-full" onClick={playSpin} disabled={isSpinning}>
              {isSpinning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Spinning...</> : hasFreeSpin ? 'SPIN FOR FREE' : `SPIN FOR ${SPIN_COST} PTS`}
            </Button>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
              First spin of the day is FREE! Subsequent spins cost points.
            </p>
          </Card>
        </div>
      )}

      {/* SCRATCH GAME */}
      {activeGame === 'scratch' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card className="p-1 text-zinc-100 bg-foreground overflow-hidden relative min-h-[300px] flex flex-col items-center justify-center text-center">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
             <Sparkles className="text-primary mb-4" size={48} />
             <h3 className="text-2xl font-black italic tracking-tighter uppercase">Silver Ticket</h3>
             <p className="text-xs text-muted-foreground mb-8 max-w-[200px]">Grand Prize: Free Club Sandwich (1 per day)</p>
             
             {globalWinners?.scratchWinner ? (
               <div className="flex flex-col items-center gap-2 bg-background/50 p-6 rounded-2xl border border-border">
                  <Lock className="text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Prize Claimed</span>
               </div>
             ) : (
               <div className="space-y-6 w-full px-8">
                 {isScratching ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest animate-pulse">Scratching...</span>
                    </div>
                 ) : scratchResult ? (
                    <div className="animate-in zoom-in-95 duration-300 py-8 space-y-4">
                        <p className="text-xl font-black text-primary tracking-tight">{scratchResult}</p>
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => setScratchResult(null)}>Try Again</Button>
                    </div>
                 ) : (
                    <Button variant="default" size="lg" className="w-full" onClick={playScratch}>
                        SCRATCH NOW
                    </Button>
                 )}
               </div>
             )}
          </Card>
        </div>
      )}

      {/* TRIVIA GAME */}
      {activeGame === 'trivia' && currentTrivia && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
           <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-primary"><Trophy size={14}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Quest: {triviaProgress}/{TRIVIA_QUEST_GOAL}</span>
              </div>
              <span className="text-[10px] font-black text-muted-foreground">Daily: {gameProfile?.triviaCount ?? 0}/{TRIVIA_DAILY_LIMIT}</span>
           </div>

           <Card className="p-6">
              {!triviaFeedback ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{currentTrivia.category}</p>
                    <h2 className="text-lg font-bold leading-snug">{currentTrivia.q}</h2>
                  </div>
                  <div className="grid gap-2">
                    {currentTrivia.options.map((opt, i) => (
                      <Button key={i} variant="outline" className="justify-start text-left h-auto py-4 px-4 whitespace-normal" onClick={() => handleTriviaAnswer(i)}>
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${triviaFeedback.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {triviaFeedback.correct ? <CheckCircle2 size={32}/> : <AlertCircle size={32}/>}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">{triviaFeedback.correct ? 'Excellent!' : 'Incorrect!'}</h3>
                    <p className="text-sm text-muted-foreground">{triviaFeedback.text}</p>
                  </div>
                  <Button className="w-full" onClick={triviaFeedback.reset ? () => setActiveGame('spin') : getNextQuestion}>
                    {triviaFeedback.reset ? 'GO BACK' : 'CONTINUE'}
                  </Button>
                </div>
              )}
           </Card>
        </div>
      )}

      {activeGame === 'trivia_limit' && (
        <Card className="p-8 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight uppercase">Daily Limit</h2>
            <p className="text-sm text-muted-foreground">You've used all 5 free daily trivia attempts. Unlock more to finish your quest!</p>
          </div>
          <div className="space-y-2">
            <Button size="lg" className="w-full" onClick={async () => {
              if ((userProfile?.loyaltyPoints ?? 0) >= 10) {
                await updatePoints(-10, "Trivia Unlock");
                if(gameProfileRef) {
                    await updateDoc(gameProfileRef, { triviaCount: 0 });
                }
                startTrivia();
              }
            }}>
              UNLOCK (10 PTS)
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setActiveGame('spin')}>Try Another Game</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function GameZonePage() {
    return <GameZonePageContent />
}