
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const [taxSettings, setTaxSettings] = useState<any[]>([]);
  const [bpjsSettings, setBpjsSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tax calculation
  const [taxInput, setTaxInput] = useState({
    grossIncome: 0,
    taxStatus: 'TK/0'
  });
  const [taxResult, setTaxResult] = useState<number | null>(null);

  // BPJS calculation
  const [bpjsInput, setBpjsInput] = useState({
    salary: 0,
  });
  const [bpjsResult, setBpjsResult] = useState<{
    kesehatan: { employee: number, company: number },
    jht: { employee: number, company: number },
    jkk: number,
    jkm: number,
    jp: { employee: number, company: number }
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch tax settings
      const { data: taxData, error: taxError } = await supabase
        .from('tax_settings')
        .select('*')
        .order('ptkp_amount', { ascending: true });

      if (taxError) throw taxError;
      setTaxSettings(taxData || []);

      // Fetch BPJS settings
      const { data: bpjsData, error: bpjsError } = await supabase
        .from('bpjs_settings')
        .select('*')
        .order('name');

      if (bpjsError) throw bpjsError;
      setBpjsSettings(bpjsData || []);

    } catch (error: any) {
      toast.error(`Failed to load settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTax = () => {
    try {
      const { grossIncome, taxStatus } = taxInput;
      
      if (grossIncome <= 0) {
        toast.error("Gross income must be greater than 0");
        return;
      }

      // Find the selected tax status
      const selectedTaxStatus = taxSettings.find(tax => tax.name === taxStatus);
      
      if (!selectedTaxStatus) {
        toast.error("Tax status not found");
        return;
      }

      // Calculate annual gross income
      const annualGross = grossIncome * 12;
      
      // Calculate taxable income (annual gross - PTKP)
      let taxableIncome = annualGross - selectedTaxStatus.ptkp_amount;
      taxableIncome = taxableIncome > 0 ? taxableIncome : 0;
      
      // Calculate tax (simplified example)
      const taxAmount = taxableIncome * (selectedTaxStatus.tax_rate / 100);
      
      // Calculate monthly tax
      const monthlyTax = taxAmount / 12;
      
      setTaxResult(monthlyTax);
    } catch (error: any) {
      toast.error(`Error calculating tax: ${error.message}`);
    }
  };

  const calculateBPJS = () => {
    try {
      const { salary } = bpjsInput;
      
      if (salary <= 0) {
        toast.error("Salary must be greater than 0");
        return;
      }

      // Find BPJS settings by type
      const kesehatanSettings = bpjsSettings.find(s => s.type === 'kesehatan') || { employee_percentage: 1, company_percentage: 4 };
      const jhtSettings = bpjsSettings.find(s => s.type === 'jht') || { employee_percentage: 2, company_percentage: 3.7 };
      const jkkSettings = bpjsSettings.find(s => s.type === 'jkk') || { company_percentage: 0.24 };
      const jkmSettings = bpjsSettings.find(s => s.type === 'jkm') || { company_percentage: 0.3 };
      const jpSettings = bpjsSettings.find(s => s.type === 'jp') || { employee_percentage: 1, company_percentage: 2 };

      const result = {
        kesehatan: {
          employee: salary * (kesehatanSettings.employee_percentage / 100),
          company: salary * (kesehatanSettings.company_percentage / 100)
        },
        jht: {
          employee: salary * (jhtSettings.employee_percentage / 100),
          company: salary * (jhtSettings.company_percentage / 100)
        },
        jkk: salary * (jkkSettings.company_percentage / 100),
        jkm: salary * (jkmSettings.company_percentage / 100),
        jp: {
          employee: salary * (jpSettings.employee_percentage / 100),
          company: salary * (jpSettings.company_percentage / 100)
        }
      };

      setBpjsResult(result);
    } catch (error: any) {
      toast.error(`Error calculating BPJS: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your app settings</p>
      </div>
      
      <Tabs defaultValue="taxbpjs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="taxbpjs">Tax & BPJS</TabsTrigger>
          <TabsTrigger value="api">API & Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your general application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" placeholder="Your Company Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <Input id="emailAddress" type="email" placeholder="admin@yourcompany.com" />
                </div>
                <Button className="mt-4">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxbpjs" className="space-y-4">
          {/* Tax Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculator</CardTitle>
              <CardDescription>Calculate employee tax based on income and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grossIncome">Monthly Gross Income (Rp)</Label>
                    <Input 
                      id="grossIncome" 
                      type="number" 
                      min={0} 
                      value={taxInput.grossIncome} 
                      onChange={(e) => setTaxInput({...taxInput, grossIncome: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxStatus">Tax Status</Label>
                    <select
                      id="taxStatus"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={taxInput.taxStatus}
                      onChange={(e) => setTaxInput({...taxInput, taxStatus: e.target.value})}
                    >
                      {taxSettings.map(status => (
                        <option key={status.id} value={status.name}>
                          {status.name} - {status.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Button onClick={calculateTax}>Calculate Tax</Button>

                {taxResult !== null && (
                  <div className="p-4 border rounded-md bg-muted">
                    <h3 className="font-medium">Tax Calculation Result</h3>
                    <p className="mt-2">Estimated monthly PPh 21: <span className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(taxResult)}</span></p>
                    <p className="text-sm text-muted-foreground">Based on the selected tax status and provided income.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BPJS Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle>BPJS Calculator</CardTitle>
              <CardDescription>Calculate BPJS contributions for healthcare and employment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpjsSalary">Monthly Salary (Rp)</Label>
                  <Input 
                    id="bpjsSalary" 
                    type="number" 
                    min={0} 
                    value={bpjsInput.salary} 
                    onChange={(e) => setBpjsInput({...bpjsInput, salary: Number(e.target.value)})} 
                  />
                </div>
                
                <Button onClick={calculateBPJS}>Calculate BPJS</Button>

                {bpjsResult && (
                  <div className="p-4 border rounded-md bg-muted">
                    <h3 className="font-medium">BPJS Calculation Result</h3>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">BPJS Kesehatan</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Employee Contribution:</p>
                          <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.kesehatan.employee)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company Contribution:</p>
                          <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.kesehatan.company)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">BPJS Ketenagakerjaan</h4>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">JHT (Jaminan Hari Tua)</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Employee:</p>
                            <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jht.employee)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Company:</p>
                            <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jht.company)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">JKK (Jaminan Kecelakaan Kerja)</h5>
                        <p className="text-sm text-muted-foreground">Company:</p>
                        <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jkk)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">JKM (Jaminan Kematian)</h5>
                        <p className="text-sm text-muted-foreground">Company:</p>
                        <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jkm)}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">JP (Jaminan Pensiun)</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Employee:</p>
                            <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jp.employee)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Company:</p>
                            <p className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bpjsResult.jp.company)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">Total Employee Contribution:</p>
                          <p className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                            bpjsResult.kesehatan.employee + bpjsResult.jht.employee + bpjsResult.jp.employee
                          )}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Company Contribution:</p>
                          <p className="font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                            bpjsResult.kesehatan.company + bpjsResult.jht.company + bpjsResult.jkk + bpjsResult.jkm + bpjsResult.jp.company
                          )}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API & Integration Settings</CardTitle>
              <CardDescription>Manage your API keys and integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex space-x-2">
                    <Input id="apiKey" type="password" value="************************" readOnly />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input id="webhookUrl" placeholder="https://yourservice.com/webhook" />
                </div>
                <Button className="mt-4">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
