import React from "react";

/**
 * ContactPage component featuring a responsive layout with 
 * business information and an interactive Google Maps embed.
 * * Note: External layout dependency removed to resolve environment compilation issues.
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <div className="h-1 w-20 bg-yellow-600 rounded"></div>
        </header>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact Information Column */}
          <div className="space-y-8">
            <p className="text-lg text-gray-600 leading-relaxed">
              We'd love to hear from you! Whether you have a question about our menu, 
              a suggestion, or just want to say hello, feel free to visit us or drop a line. 
              For specific inquiries, please use our contact form.
            </p>
            
            <div className="grid grid-cols-1 gap-8">
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Our Address</h3>
                <p className="text-gray-600">
                  911, Electricity board road,<br />
                  Battaramulla - Pannipitiya Rd,<br />
                  Battaramulla, Sri Lanka
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Opening Hours</h3>
                <div className="text-gray-600 space-y-1">
                  <p><span className="font-medium">Monday - Friday:</span> 7:00 AM - 7:00 PM</p>
                  <p><span className="font-medium">Saturday - Sunday:</span> 8:00 AM - 6:00 PM</p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Details</h3>
                <p className="text-gray-600">Email: hello@steamsbury.com</p>
              </section>
            </div>
          </div>
          
          {/* Map Column */}
          <div className="space-y-4">
            <div className="relative h-[450px] w-full rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.787144869857!2d79.919339775875!3d6.915993518475263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2570006aabb6d%3A0x14590eb0b2ce876f!2sSteamsbury%20Tea%20%26%20Coffee%20House!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Steamsbury Cafe Location"
                className="transition-all duration-700 hover:contrast-125"
              ></iframe>
            </div>
            <p className="text-xs text-gray-400 text-center italic">
              Click the map to interact or get directions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}