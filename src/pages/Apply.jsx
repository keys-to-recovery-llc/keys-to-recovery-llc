import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MobileSelect from '@/components/MobileSelect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { base44 } from '@/api/base44Client';

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Application Type
    applicationType: '',
    
    // Recovery Background
    sobrietyDate: '',
    substanceHistory: '',
    previousTreatment: '',
    currentSupport: '',
    
    // Housing Information
    reasonForHousing: '',
    housingPreference: '',
    moveInDate: '',
    
    // Additional Information
    employment: '',
    emergencyContact: '',
    emergencyPhone: '',
    additionalInfo: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format the application data for email
      const emailBody = `
NEW RECOVERY HOUSING APPLICATION
================================

PERSONAL INFORMATION
--------------------
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Date of Birth: ${formData.dateOfBirth}

APPLICATION TYPE
----------------
Type: ${formData.applicationType}

RECOVERY BACKGROUND
-------------------
Sobriety Date: ${formData.sobrietyDate}
Substance History: ${formData.substanceHistory}
Previous Treatment: ${formData.previousTreatment}
Current Support Programs: ${formData.currentSupport}

HOUSING INFORMATION
-------------------
Reason for Seeking Housing: ${formData.reasonForHousing}
Room Preference: ${formData.housingPreference}
Preferred Move-in Date: ${formData.moveInDate}

ADDITIONAL INFORMATION
----------------------
Employment Status: ${formData.employment}
Emergency Contact: ${formData.emergencyContact}
Emergency Contact Phone: ${formData.emergencyPhone}

Additional Notes:
${formData.additionalInfo}

================================
Submitted: ${new Date().toLocaleString()}
      `.trim();

      // Send email using Base44 integration
      await base44.integrations.Core.SendEmail({
        to: 'Support@keystorecoveryllc.com',
        subject: `New Application: ${formData.fullName} - ${formData.applicationType}`,
        body: emailBody
      });

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit application. Please try again or call us at (253) 240-9724.');
      console.error('Application submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-80 h-80 bg-[#4a7c59] rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <FileText className="w-4 h-4 text-[#d4a574]" />
              <span className="text-white/90 text-sm font-medium">Recovery Housing Application</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
              Apply for <span className="font-semibold">Housing</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Take the first step towards your recovery. Complete the application below 
              and our team will contact you within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-[#4a7c59]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-[#4a7c59]" />
                  </div>
                  <h2 className="text-3xl font-semibold text-[#1e3a5f] mb-4">Application Submitted!</h2>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Thank you for applying to Keys to Recovery. Our team will review your application 
                    and contact you within 24 hours to discuss next steps.
                  </p>
                  <div className="space-y-3 text-left max-w-md mx-auto bg-[#f5f5f5] rounded-lg p-6">
                    <p className="text-sm font-semibold text-[#1e3a5f]">What happens next?</p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Application review (24 hours)</li>
                      <li>• Initial phone screening</li>
                      <li>• House tour and interview</li>
                      <li>• Background check</li>
                      <li>• Move-in coordination</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-0 shadow-2xl">
              <CardHeader className="p-8 border-b bg-white">
                <CardTitle className="text-2xl text-[#1e3a5f]">Recovery Housing Application</CardTitle>
                <p className="text-gray-600 mt-2">Please complete all required fields marked with *</p>
              </CardHeader>
              
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white font-semibold text-sm">1</div>
                      <h3 className="text-xl font-semibold text-[#1e3a5f]">Personal Information</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          required
                          value={formData.fullName}
                          onChange={(e) => updateField('fullName', e.target.value)}
                          placeholder="John Doe"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          required
                          value={formData.dateOfBirth}
                          onChange={(e) => updateField('dateOfBirth', e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="john@example.com"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="(253) 555-1234"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Application Type */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white font-semibold text-sm">2</div>
                      <h3 className="text-xl font-semibold text-[#1e3a5f]">Application Type</h3>
                    </div>

                    <div className="space-y-2">
                      <Label>I am applying as a: *</Label>
                      <RadioGroup value={formData.applicationType} onValueChange={(value) => updateField('applicationType', value)} required>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="resident" id="resident" />
                          <Label htmlFor="resident" className="font-normal cursor-pointer">Potential Resident</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="family" id="family" />
                          <Label htmlFor="family" className="font-normal cursor-pointer">Family Member (applying on behalf of someone)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="referral" id="referral" />
                          <Label htmlFor="referral" className="font-normal cursor-pointer">Professional Referral</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Recovery Background */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white font-semibold text-sm">3</div>
                      <h3 className="text-xl font-semibold text-[#1e3a5f]">Recovery Background</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sobrietyDate">Sobriety Date (if applicable)</Label>
                      <Input
                        id="sobrietyDate"
                        type="date"
                        value={formData.sobrietyDate}
                        onChange={(e) => updateField('sobrietyDate', e.target.value)}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="substanceHistory">Substance Use History * <span className="text-muted-foreground text-xs">({(formData.substanceHistory || '').length}/600 characters)</span></Label>
                      <Textarea
                        id="substanceHistory"
                        required
                        rows={5}
                        maxLength={600}
                        value={formData.substanceHistory}
                        onChange={(e) => updateField('substanceHistory', e.target.value)}
                        placeholder="Please describe your substance use history in your own words. Include substances used, duration, and any patterns you've noticed. (600 characters max)"
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousTreatment">Previous Treatment Programs *</Label>
                      <Textarea
                        id="previousTreatment"
                        required
                        rows={4}
                        value={formData.previousTreatment}
                        onChange={(e) => updateField('previousTreatment', e.target.value)}
                        placeholder="List any inpatient, outpatient, or other treatment programs you've attended..."
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentSupport">Current Support Programs</Label>
                      <Input
                        id="currentSupport"
                        value={formData.currentSupport}
                        onChange={(e) => updateField('currentSupport', e.target.value)}
                        placeholder="e.g., AA, NA, therapy, sponsor"
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Housing Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white font-semibold text-sm">4</div>
                      <h3 className="text-xl font-semibold text-[#1e3a5f]">Housing Information</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reasonForHousing">Why are you seeking recovery housing? *</Label>
                      <Textarea
                        id="reasonForHousing"
                        required
                        rows={4}
                        value={formData.reasonForHousing}
                        onChange={(e) => updateField('reasonForHousing', e.target.value)}
                        placeholder="Tell us about your situation and goals..."
                        className="resize-none"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="housingPreference">Room Preference</Label>
                        <MobileSelect value={formData.housingPreference} onValueChange={(value) => updateField('housingPreference', value)} placeholder="Select preference" className="h-12">
                            <SelectItem value="private">Private Room</SelectItem>
                            <SelectItem value="shared">Shared Room</SelectItem>
                            <SelectItem value="any">Any Available</SelectItem>
                          </MobileSelect>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
                        <Input
                          id="moveInDate"
                          type="date"
                          value={formData.moveInDate}
                          onChange={(e) => updateField('moveInDate', e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white font-semibold text-sm">5</div>
                      <h3 className="text-xl font-semibold text-[#1e3a5f]">Additional Information</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employment">Employment Status *</Label>
                      <MobileSelect value={formData.employment} onValueChange={(value) => updateField('employment', value)} placeholder="Select status" className="h-12" required>
                          <SelectItem value="employed">Employed Full-Time</SelectItem>
                          <SelectItem value="parttime">Employed Part-Time</SelectItem>
                          <SelectItem value="seeking">Actively Seeking Employment</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </MobileSelect>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContact"
                          required
                          value={formData.emergencyContact}
                          onChange={(e) => updateField('emergencyContact', e.target.value)}
                          placeholder="Name"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          required
                          value={formData.emergencyPhone}
                          onChange={(e) => updateField('emergencyPhone', e.target.value)}
                          placeholder="(253) 555-1234"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        rows={4}
                        value={formData.additionalInfo}
                        onChange={(e) => updateField('additionalInfo', e.target.value)}
                        placeholder="Is there anything else you'd like us to know?"
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6 space-y-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-semibold py-6 text-lg rounded-xl"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting Application...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-5 w-5" />
                          Submit Application
                        </span>
                      )}
                    </Button>
                    <p className="text-center text-gray-500 text-sm">
                      By submitting this application, you acknowledge that the information provided is accurate 
                      and consent to a background check.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Help Section */}
      {!submitted && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-[#1e3a5f] mb-4">Need Help with Your Application?</h3>
            <p className="text-gray-600 mb-6">
              If you have questions or need assistance completing this form, please don't hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+12532409724">
                <Button className="bg-[#4a7c59] hover:bg-[#3a6c49] text-white px-8 py-6 rounded-full">
                  Call (253) 240-9724
                </Button>
              </a>
              <a href="mailto:Support@keystorecoveryllc.com">
                <Button variant="outline" className="px-8 py-6 rounded-full">
                  Email Support
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}