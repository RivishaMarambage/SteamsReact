'use client';

import React from 'react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
            <PublicHeader />
            
            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-[#2c1810] mb-4 uppercase">
                            Privacy <span className="text-[#d97706]">Policy</span>
                        </h1>
                        <p className="text-[#6b584b] text-lg font-medium">Steamsbury (Pvt) Ltd • Effective Date: 2026/01/01</p>
                    </div>

                    <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
                        <CardContent className="p-8 md:p-12 space-y-10 text-[#2c1810]">
                            <section className="space-y-4">
                                <p className="leading-relaxed">
                                    Steamsbury (Pvt) Ltd (“we”, “us”, or “our”) is committed to protecting the privacy and personal data of individuals who access our website and register as members. This Privacy Policy sets out how we collect, process, store, and protect personal data in compliance with the Personal Data Protection Act, No. 9 of 2022 of Sri Lanka (“PDPA”).
                                </p>
                                <p className="leading-relaxed">
                                    By using our website and registering as a member, you acknowledge that you have read, understood, and agreed to the terms of this Privacy Policy.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">1. Controller of Personal Data</h2>
                                <p className="leading-relaxed">
                                    For the purposes of the PDPA, Steamsbury (Pvt) Ltd is the Data Controller in respect of all personal data collected through this website. We have appointed a Data Protection Officer (DPO) to oversee our data protection strategy and ensure compliance with local regulations.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">2. Personal Data We Collect</h2>
                                <p className="leading-relaxed">
                                    When you sign up to become a member, we collect the following personal data:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>Full Name</li>
                                    <li>Phone Number</li>
                                    <li>Email Address</li>
                                    <li>Date of Birth</li>
                                </ul>
                                <p className="leading-relaxed">
                                    We do not collect sensitive personal data (such as health information or religious beliefs) unless expressly required and lawfully permitted under the PDPA.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">3. Children’s Privacy</h2>
                                <p className="leading-relaxed">
                                    Our website and membership services are intended for individuals who are at least 18 years of age. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected personal data from a child under the age of 18 without verifiable parental consent, we will take immediate steps to delete such information from our records.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">4. Lawful Basis for Processing</h2>
                                <p className="leading-relaxed">
                                    Personal data is processed in accordance with the lawful bases stipulated under the PDPA, including:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>Consent provided by you at the time of registration.</li>
                                    <li>Performance of a contract, namely the provision and administration of membership services.</li>
                                    <li>Legitimate interests of Steamsbury (Pvt) Ltd, provided such interests do not override your fundamental rights.</li>
                                    <li>Compliance with legal and regulatory obligations.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">5. Purpose of Processing</h2>
                                <p className="leading-relaxed">
                                    Your personal data is processed for the following purposes:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>To register, verify, and manage your membership.</li>
                                    <li>To communicate regarding benefits, promotions, and service updates.</li>
                                    <li>To provide birthday-related or age-specific offers.</li>
                                    <li>To improve our products, services, and customer engagement.</li>
                                    <li>To comply with applicable laws and regulatory directives.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">6. Direct Marketing and Opt-Out Rights</h2>
                                <p className="leading-relaxed">
                                    We may use your personal data to send you promotional materials. You have the absolute right to opt-out of direct marketing at any time by:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>Clicking the ‘unsubscribe’ link in any of our marketing emails.</li>
                                    <li>Contacting us directly via the details provided in Section 14.</li>
                                </ul>
                                <p className="leading-relaxed font-bold italic">
                                    Opting out of marketing does not affect our ability to send you essential administrative messages regarding your account.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">7. Disclosure of Personal Data</h2>
                                <p className="leading-relaxed">
                                    Steamsbury (Pvt) Ltd does not sell, rent, or trade personal data. Data may be disclosed only:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>To authorised third-party service providers (e.g., IT hosting, email delivery) subject to strict confidentiality agreements.</li>
                                    <li>To regulatory authorities or law enforcement where required by Sri Lankan law.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">8. Data Security Measures</h2>
                                <p className="leading-relaxed">
                                    We implement appropriate technical and organisational security measures to protect personal data against unauthorised access, loss, or alteration. Access is restricted to authorised personnel on a strict "need-to-know" basis.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">9. Data Retention</h2>
                                <p className="leading-relaxed">
                                    Personal data will be retained only for as long as necessary to achieve the purposes for which it was collected or as required by law. Upon completion of the retention period, data will be securely deleted or irreversibly anonymised.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">10. Rights of Data Subjects</h2>
                                <p className="leading-relaxed">
                                    In accordance with the PDPA, you are entitled to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                                    <li>Request access to your personal data.</li>
                                    <li>Request rectification of inaccurate or incomplete data.</li>
                                    <li>Request erasure of data, subject to statutory limitations.</li>
                                    <li>Object to or request restriction of processing.</li>
                                    <li>Withdraw consent at any time.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">11. Cookies and Website Technologies</h2>
                                <p className="leading-relaxed">
                                    This website do not use cookies. This website do not collect personally identifiable information unless voluntarily provided by you.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">12. Third-Party Links</h2>
                                <p className="leading-relaxed">
                                    Our website may contain links to external sites or social media platforms. Steamsbury (Pvt) Ltd is not responsible for the privacy practices of these third parties, and we encourage you to read their respective policies.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">13. Cross-Border Data Transfers</h2>
                                <p className="leading-relaxed">
                                    If personal data is transferred outside Sri Lanka (e.g., for cloud storage), we ensure that such transfers comply with the PDPA and that appropriate safeguards are in place to protect your information.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">14. Contact Information</h2>
                                <p className="leading-relaxed">
                                    For inquiries, requests to exercise your rights, or complaints, please contact our Data Protection Officer:
                                </p>
                                <div className="p-8 bg-[#d97706]/5 rounded-3xl border-2 border-[#d97706]/10 space-y-2">
                                    <p className="font-black text-[#2c1810]">Steamsbury (Pvt) Ltd Attn: Data Protection Officer</p>
                                    <p>Address: 911, Pannipitiya road, Battaramulla</p>
                                    <p>Email: steamsbury@gmail.com</p>
                                    <p>Phone: +94740479838</p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-headline font-bold text-[#d97706] uppercase tracking-tight">15. Amendments to This Privacy Policy</h2>
                                <p className="leading-relaxed">
                                    We reserve the right to update this policy at any time. Revisions will be published on this page with an updated effective date. Continued use of the website constitutes acceptance of the revised policy.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
