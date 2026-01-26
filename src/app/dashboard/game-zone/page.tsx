'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, errorEmitter } from '@/firebase';
import { doc, setDoc, updateDoc, increment, collection, onSnapshot, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Trophy, Coins, Lock, Sparkles, Dices, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, GameProfile, DailyGameWinners, PointTransaction } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { Ticket } from 'lucide-react';

// --- CONSTANTS ---
const DAILY_LIMIT = 5; // Free daily attempts for trivia
const TRIVIA_QUEST_GOAL = 5; // Correct answers needed for prize

const QUESTION_BANK = [
  { category: 'Ancient History', q: 'Which king made Sigiriya his capital in the 5th century AD?', options: ['King Kashyapa', 'King Parakramabahu', 'King Dutugemunu', 'King Devanampiya Tissa'], correct: 0, fact: "King Kashyapa built his palace on the summit of Sigiriya rock." },
  { category: 'Tea & Coffee', q: 'Who first planted coffee in Sri Lanka on a commercial scale?', options: ['The Portuguese', 'The Dutch', 'The British', 'The Kandyans'], correct: 1, fact: 'The Dutch were the first to attempt commercial coffee cultivation.' },
  { category: 'Culture', q: 'The Temple of the Tooth in Kandy holds a relic of whom?', options: ['Shiva', 'Vishnu', 'The Buddha', 'Ganesha'], correct: 2, fact: 'The Sacred Tooth Relic is one of the most revered objects in Buddhism.' },
  { category: 'Ancient History', q: 'What was the first capital of Sri Lanka?', options: ['Polonnaruwa', 'Kandy', 'Anuradhapura', 'Galle'], correct: 2, fact: 'Anuradhapura was the capital for over 1000 years.' },
  { category: 'Culture', q: 'The "Bridge in the Sky" is another name for which landmark?', options: ['Galle Face', 'Nine Arch Bridge', 'Victoria Dam', 'Adam\'s Peak'], correct: 1, fact: 'It is located in Ella and was built without any steel.' }
];

function GameZoneContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameProfile, setGameProfile] = useState<GameProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [globalWinners, setGlobalWinners] = useState<DailyGameWinners | null>(null);
  const [activeGame, setActiveGame] = useState('spin');

  // Trivia State
  const [triviaProgress, setTriviaProgress] = useState(0);
  const [currentTrivia, setCurrentTrivia] = useState<(typeof QUESTION_BANK)[number] | null>(null);
  const [triviaFeedback, setTriviaFeedback] = useState<{ correct: boolean; text: string; fact?: string; reset?: boolean } | null>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Data Listeners
  useEffect(() => {
    if (!user || !firestore) return;

    // User Profile Listener
    const userRef = doc(firestore, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    });
    
    // Game Profile Listener
    const gameProfileRef = doc(firestore, 'users', user.uid, 'data', 'game_profile');
    const unsubGameProfile = onSnapshot(gameProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameProfile;
        if (data.lastPlayedDate !== today) {
          // Reset daily limits on a new day
          updateDoc(gameProfileRef, { lastPlayedDate: today, triviaCount: 0 });
        }
        setGameProfile(data);
      } else {
        // Create initial game profile
        const initialProfile: GameProfile = { lastPlayedDate: today, triviaCount: 0 };
        setDoc(gameProfileRef, initialProfile);
      }
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: gameProfileRef.path, operation: 'get'}));
    });

    // Global Winners Listener
    const globalRef = doc(firestore, 'daily_game_winners', today);
    const unsubGlobal = onSnapshot(globalRef, (docSnap) => {
      if (docSnap.exists()) {
        setGlobalWinners(docSnap.data() as DailyGameWinners);
      } else {
        const initialWinners: DailyGameWinners = { spinWinner: null, scratchWinner: null, triviaWinner: null };
        setDoc(globalRef, initialWinners);
      }
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: globalRef.path, operation: 'get'}));
    });

    return () => { unsubUser(); unsubGameProfile(); unsubGlobal(); };
  }, [user, firestore, today]);

  const isLoading = isUserLoading || !gameProfile || !userProfile;

  // --- CORE GAME ENGINE ---
  const handleGrandWin = async (gameKey: 'spinWinner' | 'scratchWinner' | 'triviaWinner', prizeName: string) => {
    if (!user || !firestore) return false;

    const globalRef = doc(firestore, 'daily_game_winners', today);
    const userRef = doc(firestore, 'users', user.uid);

    try {
      await runTransaction(firestore, async (transaction) => {
        const globalSnap = await transaction.get(globalRef);
        const currentData = (globalSnap.data() || {}) as DailyGameWinners;

        if (currentData[gameKey]) {
          throw new Error("Grand prize already claimed today!");
        }
        
        const updateData = { [gameKey]: user.uid };
        transaction.set(globalRef, updateData, { merge: true });
        transaction.update(userRef, { loyaltyPoints: increment(50) }); // Bonus for grand win
      });

      toast({ title: "GRAND PRIZE!", description: `You won ${prizeName}! 50 Bonus Points added.` });
      return true;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Prize Claimed", description: "Someone else just claimed the daily prize!" });
      return false;
    }
  };

  const updatePoints = async (amount: number, description: string) => {
     if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    const transactionRef = doc(collection(firestore, `users/${user.uid}/point_transactions`));
    
    const batch = writeBatch(firestore);

    batch.update(userRef, { loyaltyPoints: increment(amount) });

    const transactionData: Omit<PointTransaction, 'id'> = {
        date: serverTimestamp() as any,
        description: description,
        amount: amount,
        type: 'earn'
    };
    batch.set(transactionRef, transactionData);
    
    await batch.commit().catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({path: userRef.path, operation: 'write'}));
    });
  };

  // --- TRIVIA LOGIC ---
  const startTrivia = () => {
    if (!gameProfile) return;
    if (gameProfile.triviaCount >= DAILY_LIMIT) {
      setActiveGame('trivia_limit');
    } else {
      getNextQuestion();
      setActiveGame('trivia');
    }
  };

  const getNextQuestion = () => {
    const random = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
    setCurrentTrivia(random);
    setTriviaFeedback(null);
  };

  const handleTriviaAnswer = async (index: number) => {
    if (!currentTrivia || !user || !firestore) return;

    const isCorrect = index === currentTrivia.correct;
    if (isCorrect) {
      const nextProgress = triviaProgress + 1;
      const gameProfileRef = doc(firestore, 'users', user.uid, 'data', 'game_profile');
      await updateDoc(gameProfileRef, { triviaCount: increment(1) });

      if (nextProgress >= TRIVIA_QUEST_GOAL) {
        setTriviaProgress(0);
        const won = await handleGrandWin('triviaWinner', '40% Total Discount');
        if (!won) await updatePoints(10, 'Trivia Consolation Prize');
        setTriviaFeedback({ correct: true, text: "Quest Complete!", fact: currentTrivia.fact, reset: true });
      } else {
        setTriviaProgress(nextProgress);
        setTriviaFeedback({ correct: true, text: `Correct! (${nextProgress}/${TRIVIA_QUEST_GOAL})`, fact: currentTrivia.fact });
      }
    } else {
      setTriviaFeedback({ correct: false, text: "Incorrect answer." });
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-3xl">Game Zone</CardTitle>
                <CardDescription>Win daily rewards and points!</CardDescription>
              </div>
              <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                <Coins size={18} className="text-primary" />
                <span className="font-bold text-xl">{userProfile?.loyaltyPoints ?? 0}</span>
            </div>
          </CardHeader>
      </Card>
      
        {/* Game Navigation */}
        <div className="flex bg-muted p-1.5 rounded-xl border">
          <NavBtn active={activeGame === 'spin'} onClick={() => setActiveGame('spin')} icon={<Dices size={16}/>} label="Spin" />
          <NavBtn active={activeGame === 'scratch'} onClick={() => setActiveGame('scratch')} icon={<Ticket size={16}/>} label="Scratch" />
          <NavBtn active={activeGame === 'trivia_limit' || activeGame === 'trivia'} onClick={startTrivia} icon={<Trophy size={16}/>} label="Trivia" />
        </div>

        {/* SPIN VIEW */}
        {activeGame === 'spin' && (
          <Card className="animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-2xl">The Lucky Wheel</CardTitle>
              <CardDescription>One Free Coffee available globally per day.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center mb-8 relative">
                 <div className={`w-48 h-48 rounded-full border-8 border-primary/20 relative flex items-center justify-center overflow-hidden transition-transform duration-1000`}>
                   <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                      <div className="bg-muted/30 border border-border flex items-center justify-center font-bold text-xs">5 PTS</div>
                      <div className="bg-background border border-border flex items-center justify-center font-bold text-xs">1 PT</div>
                      <div className="bg-muted/50 border border-border flex items-center justify-center font-bold text-xs">10 PTS</div>
                      <div className={`${globalWinners?.spinWinner ? 'bg-zinc-100 text-zinc-400' : 'bg-green-100 text-green-700'} border border-border flex flex-col items-center justify-center font-black text-[9px]`}>
                        {globalWinners?.spinWinner ? <Lock size={12}/> : <Coffee size={12}/>}
                        {globalWinners?.spinWinner ? 'TAKEN' : 'COFFEE'}
                      </div>
                   </div>
                 </div>
                 <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-red-600 w-0 h-0 z-10" />
              </div>
              <Button 
                onClick={async () => {
                  const outcomes = [1, 5, 10, 'GRAND'];
                  const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
                  if (pick === 'GRAND' && !globalWinners?.spinWinner) {
                    await handleGrandWin('spinWinner', 'Free Daily Coffee');
                  } else {
                    const pts = typeof pick === 'number' ? pick : 2;
                    await updatePoints(pts, "Lucky Wheel Spin");
                    toast({title: `+${pts} Points won!`});
                  }
                }}
                className="w-full"
                size="lg"
              >
                SPIN FOR FREE
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SCRATCH VIEW */}
        {activeGame === 'scratch' && (
           <Card className="bg-foreground text-background p-10 rounded-2xl shadow-xl text-center min-h-[320px] flex flex-col items-center justify-center border-4 border-card animate-in fade-in zoom-in-95 duration-300">
                <Sparkles className="text-primary mb-4" size={48} />
                <h3 className="font-headline text-2xl uppercase mb-2">Silver Ticket</h3>
                <p className="text-muted-foreground text-xs mb-8">Grand Prize: Free Club Sandwich</p>
                {globalWinners?.scratchWinner ? (
                  <div className="bg-muted/20 p-4 rounded-xl flex items-center gap-2">
                    <Lock size={16} className="text-muted-foreground" />
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Prize Claimed Today</span>
                  </div>
                ) : (
                  <Button 
                    onClick={async () => {
                      if (Math.random() < 0.1 && !globalWinners?.scratchWinner) await handleGrandWin('scratchWinner', 'Free Club Sandwich');
                      else { await updatePoints(5, "Scratch Card"); toast({description: "+5 Points added."}); }
                    }}
                  >
                    Scratch to Reveal
                  </Button>
                )}
             </Card>
        )}

        {/* TRIVIA VIEW */}
        {(activeGame === 'trivia' && currentTrivia) && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex justify-between items-center px-2">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-green-600/10 rounded-lg flex items-center justify-center text-green-600"><Trophy size={14}/></div>
                 <span className="text-xs font-bold uppercase tracking-widest text-green-600">Quest: {triviaProgress}/{TRIVIA_QUEST_GOAL}</span>
               </div>
               <span className="text-xs font-bold text-muted-foreground">Daily: {gameProfile?.triviaCount ?? 0}/{DAILY_LIMIT}</span>
             </div>

             <Card>
                <CardHeader>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest">{currentTrivia.category}</p>
                  <CardTitle className="text-xl leading-tight">{currentTrivia.q}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   {!triviaFeedback ? (
                     currentTrivia.options.map((opt, i) => (
                       <Button key={i} onClick={() => handleTriviaAnswer(i)} variant="outline" className="w-full text-left p-4 h-auto justify-start">
                         {opt}
                       </Button>
                     ))
                   ) : (
                     <div className="animate-in slide-in-from-bottom-4">
                        <div className={`p-4 rounded-xl ${triviaFeedback.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mb-4`}>
                           <p className="font-bold uppercase mb-1">{triviaFeedback.correct ? 'Correct!' : 'Incorrect'}</p>
                           <p className="text-sm">{triviaFeedback.text}</p>
                           {triviaFeedback.fact && <p className="text-xs mt-2 italic opacity-70">Did you know: {triviaFeedback.fact}</p>}
                        </div>
                        <Button 
                          onClick={triviaFeedback.reset ? () => setActiveGame('spin') : getNextQuestion} 
                          className="w-full"
                        >
                          {triviaFeedback.reset ? "CLOSE" : "CONTINUE"}
                        </Button>
                     </div>
                   )}
                </CardContent>
             </Card>
          </div>
        )}

        {/* LIMIT VIEW */}
        {activeGame === 'trivia_limit' && (
          <Card className="text-center animate-in zoom-in-95">
            <CardHeader>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <Lock size={32} />
                </div>
                <CardTitle className="font-headline text-2xl">Limit Reached</CardTitle>
                <CardDescription className="leading-relaxed">You've used your {DAILY_LIMIT} daily free trivia attempts. Want to keep playing to finish your quest?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
             <Button 
               onClick={async () => {
                 if ((userProfile?.loyaltyPoints ?? 0) >= 10) {
                   await updatePoints(-10, "Unlock Trivia Attempts");
                   const gameProfileRef = doc(firestore, 'users', user!.uid, 'data', 'game_profile');
                   await updateDoc(gameProfileRef, { triviaCount: 0 }); // Unlock
                   getNextQuestion();
                   setActiveGame('trivia');
                 } else { toast({ variant:"destructive", title: "Insufficient Points" }); }
               }}
               size="lg"
             >
               UNLOCK (10 PTS)
             </Button>
             <Button onClick={() => setActiveGame('spin')} variant="link">Try another game</Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

const NavBtn = ({ active, onClick, icon, label }: {active: boolean, onClick: () => void, icon: React.ReactNode, label: string}) => (
  <Button 
    onClick={onClick}
    variant={active ? 'secondary' : 'ghost'}
    className="flex-1 flex items-center justify-center gap-2 rounded-lg transition-all"
  >
    {icon}
    <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
  </Button>
);

export default function GameZonePage() {
    return (
        <GameZoneContent />
    )
}
