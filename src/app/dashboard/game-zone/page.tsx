'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Flame, Coins, Trophy, Ticket, Gift, Dices, RotateCcw, Landmark, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// --- QUESTION BANK FOR TRIVIA ---
const QUESTION_BANK = [
    {
        category: 'Ancient History',
        question: 'Which king made Sigiriya his capital in the 5th century AD?',
        answers: ['King Kashyapa', 'King Parakramabahu', 'King Dutugemunu', 'King Devanampiya Tissa'],
        correctAnswer: 'King Kashyapa',
        fact: "King Kashyapa built his palace on the summit of Sigiriya rock and decorated its sides with colorful frescoes.",
        reward: { type: 'discount', value: 40 }
    },
    {
        category: 'Tea & Coffee History',
        question: 'Who first planted coffee in Sri Lanka on a commercial scale?',
        answers: ['The Portuguese', 'The Dutch', 'The British', 'The Kandyans'],
        correctAnswer: 'The Dutch',
        fact: 'The Dutch were the first to attempt commercial coffee cultivation, though it was the British who later scaled it up.',
        reward: { type: 'item', value: 'Free Tea' }
    },
    {
        category: 'Culture',
        question: 'The Temple of the Tooth in Kandy holds a relic of whom?',
        answers: ['Shiva', 'Vishnu', 'The Buddha', 'Ganesha'],
        correctAnswer: 'The Buddha',
        fact: 'The Sacred Tooth Relic of the Buddha is one of the most revered objects for Buddhists worldwide.',
        reward: { type: 'discount', value: 20 }
    }
];

// --- GAME COMPONENTS ---

const SpinTheWheel = ({ balance, onGameEnd }: { balance: number, onGameEnd: (amount: number, message: string) => void }) => {
    const prizes = [
        { points: 5, label: '5 PTS' },
        { points: 1, label: '1 PT' },
        { points: 0, label: 'TRY AGAIN' },
        { points: 2, label: '2 PTS' },
        { points: 20, label: '20 PTS' },
        { points: 0, label: 'Free Coffee', isGrandPrize: true },
        { points: 1, label: '1 PT' },
        { points: 2, label: '2 PTS' },
    ];
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<number | null>(null);

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setSpinResult(null);

        const resultIndex = Math.floor(Math.random() * prizes.length);
        const prize = prizes[resultIndex];
        const totalDegrees = 360 * 5; // 5 full rotations
        const segmentAngle = 360 / prizes.length;
        const resultAngle = totalDegrees - (resultIndex * segmentAngle) - (segmentAngle / 2);
        
        // This will be set on the wheel style
        setSpinResult(resultAngle);

        setTimeout(() => {
            setIsSpinning(false);
            if (prize.isGrandPrize) {
                onGameEnd(0, 'Grand Prize! You won a Free Coffee!');
            } else {
                onGameEnd(prize.points, prize.points > 0 ? `You won ${prize.points} points!` : 'Better luck next time!');
            }
        }, 3000); // Corresponds to animation duration + delay
    };

    return (
        <Card className="shadow-lg overflow-hidden">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Dices /> Spin the Wheel</CardTitle>
                <CardDescription>Spin for a chance to win points or a grand prize!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-8 py-8">
                <div className="relative w-64 h-64 border-4 border-primary rounded-full">
                    <div
                        className="w-full h-full rounded-full transition-transform duration-[3s] ease-in-out"
                        style={{ transform: `rotate(${spinResult ?? 0}deg)` }}
                    >
                        {prizes.map((prize, i) => (
                            <div
                                key={i}
                                className="absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center"
                                style={{
                                    transform: `rotate(${i * (360 / prizes.length)}deg)`,
                                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 100%)',
                                }}
                            >
                                <div
                                    className={cn("w-full h-full text-center flex items-center justify-center -rotate-45", i % 2 === 0 ? 'bg-muted' : 'bg-background')}
                                >
                                    <span className={cn("font-bold text-sm", prize.isGrandPrize && 'text-primary')}>{prize.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-card border-2 border-primary rounded-full" />
                </div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-primary" style={{top: 'calc(50% - 128px - 4px)'}} />
                <Button onClick={handleSpin} disabled={isSpinning}>
                    {isSpinning ? 'Spinning...' : 'Spin'}
                </Button>
            </CardContent>
        </Card>
    );
};

const ScratchAndWin = ({ balance, onDebit, onGameEnd }: { balance: number, onDebit: (amount: number) => Promise<boolean>, onGameEnd: (amount: number, message: string) => void }) => {
    const [isScratched, setIsScratched] = useState(false);
    const [result, setResult] = useState<'win' | 'lose' | null>(null);

    const handleScratch = () => {
        const didWin = Math.random() < 0.05; // 5% chance to win
        setResult(didWin ? 'win' : 'lose');
        setIsScratched(true);
        if (didWin) {
            onGameEnd(0, 'You won the Grand Prize: A Free Club Sandwich!');
        }
    };

    const handleRetry = async () => {
        const canAfford = await onDebit(10);
        if (canAfford) {
            setIsScratched(false);
            setResult(null);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Ticket /> Scratch &amp; Win</CardTitle>
                <CardDescription>A 5% chance to win a free club sandwich!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 py-8">
                <div className="relative w-64 h-32 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                    {!isScratched ? (
                        <Button onClick={handleScratch}>Scratch to Reveal</Button>
                    ) : (
                        <div className="text-center">
                            {result === 'win' ? (
                                <>
                                    <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-bold text-lg">You Won!</p>
                                    <p className="text-sm">Free Club Sandwich!</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-lg">Try Again!</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {isScratched && result === 'lose' && (
                    <Button onClick={handleRetry} disabled={balance < 10}>
                        <RotateCcw className="mr-2"/> Retry (10 Points)
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

const HeritageTrivia = ({ onGameEnd }: { onGameEnd: (amount: number, message: string, reward?: any) => void }) => {
    const [question, setQuestion] = useState<(typeof QUESTION_BANK)[0] | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        if (!question) {
            handleNextQuestion();
        }
    }, [question]);

    const handleNextQuestion = () => {
        const randomIndex = Math.floor(Math.random() * QUESTION_BANK.length);
        setQuestion(QUESTION_BANK[randomIndex]);
        setSelectedAnswer(null);
        setIsAnswered(false);
    };

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (answer === question?.correctAnswer) {
             const message = `Correct! Fact: ${question.fact}`;
             onGameEnd(0, message, question.reward);
        } else {
            onGameEnd(0, `Incorrect. The correct answer was: ${question?.correctAnswer}`);
        }
    };
    
    if (!question) return <Skeleton className="h-96 w-full" />;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><Landmark /> Heritage Trivia</CardTitle>
                <CardDescription>Test your knowledge and win big rewards!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
                 <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">{question.category}</p>
                    <p className="text-lg font-medium">{question.question}</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {question.answers.map(answer => (
                        <Button
                            key={answer}
                            variant="outline"
                            className={cn(
                                "h-auto py-3 justify-start text-left",
                                isAnswered && answer === question.correctAnswer && 'bg-green-500/20 border-green-500 text-green-700',
                                isAnswered && selectedAnswer === answer && answer !== question.correctAnswer && 'bg-destructive/20 border-destructive text-destructive-foreground'
                            )}
                            onClick={() => handleAnswer(answer)}
                            disabled={isAnswered}
                        >
                            {answer}
                        </Button>
                     ))}
                 </div>
                 {isAnswered && (
                     <Button onClick={handleNextQuestion} className="w-full">
                         Play Again
                     </Button>
                 )}
            </CardContent>
        </Card>
    )
};


export default function GameZonePage() {
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [activeGame, setActiveGame] = useState<'spin' | 'scratch' | 'trivia'>('spin');

    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const [points, setPoints] = useState(0);

    useEffect(() => {
        if (userProfile) {
            setPoints(userProfile.loyaltyPoints ?? 0);
        }
    }, [userProfile]);

    const handleDebit = async (amount: number): Promise<boolean> => {
        if (points < amount) {
            toast({
                variant: 'destructive',
                title: 'Not enough points!',
                description: `You need ${amount} points to do this.`,
            });
            return false;
        }

        if (!userDocRef) return false;

        const newPoints = points - amount;
        setPoints(newPoints); // Optimistic update
        
        try {
            await updateDoc(userDocRef, { loyaltyPoints: increment(-amount) });
            toast({
                title: `-${amount} Points`,
                description: 'Points have been debited from your account.',
            });
            return true;
        } catch (error) {
            const contextualError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { loyaltyPoints: increment(-amount) },
            });
            errorEmitter.emit('permission-error', contextualError);
            setPoints(points); // Revert optimistic update
            return false;
        }
    };
    
    const handleGameEnd = async (amount: number, message: string, reward?: any) => {
        if (amount > 0) {
            if (!userDocRef) return;
            const newPoints = points + amount;
            setPoints(newPoints);
            await updateDoc(userDocRef, { loyaltyPoints: increment(amount), lifetimePoints: increment(amount) });
        }
        
        if (reward) {
            // This is a placeholder for a more complex reward system
            // For now, we'll just show it in the toast
             toast({
                title: 'Reward Won!',
                description: `${message}. Your reward is: ${reward.type === 'item' ? reward.value : `${reward.value}% OFF`}`,
                duration: 5000,
            });
        } else {
             toast({
                title: 'Game Over',
                description: message,
            });
        }
    };

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/3"/>
                <Skeleton className="h-96 w-full"/>
            </div>
        )
    }


    return (
        <div className="pb-24">
            <div className="space-y-8">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow">
                    <h1 className="text-3xl font-bold font-headline">Game Zone</h1>
                    <div className="text-right">
                        <p className="font-bold text-2xl text-primary flex items-center gap-2">{points} <Coins className="h-6 w-6 text-yellow-500" /></p>
                        <p className="text-sm text-muted-foreground">Your Points</p>
                    </div>
                </div>

                {activeGame === 'spin' && <SpinTheWheel balance={points} onGameEnd={handleGameEnd} />}
                {activeGame === 'scratch' && <ScratchAndWin balance={points} onDebit={handleDebit} onGameEnd={handleGameEnd} />}
                {activeGame === 'trivia' && <HeritageTrivia onGameEnd={handleGameEnd} />}
            </div>

            {/* Floating Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t shadow-lg md:hidden">
                <div className="grid grid-cols-3 h-full">
                    <Button variant="ghost" className={cn("h-full flex-col gap-1 rounded-none", activeGame === 'spin' && 'text-primary')} onClick={() => setActiveGame('spin')}>
                        <Dices /> <span className="text-xs">Spin</span>
                    </Button>
                    <Button variant="ghost" className={cn("h-full flex-col gap-1 rounded-none", activeGame === 'scratch' && 'text-primary')} onClick={() => setActiveGame('scratch')}>
                        <Ticket /> <span className="text-xs">Scratch</span>
                    </Button>
                    <Button variant="ghost" className={cn("h-full flex-col gap-1 rounded-none", activeGame === 'trivia' && 'text-primary')} onClick={() => setActiveGame('trivia')}>
                        <Trophy /> <span className="text-xs">Trivia</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
