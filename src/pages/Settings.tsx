import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define the types for tax and BPJS settings
interface TaxSetting {
  id: string;
  name: string;
  description: string | null;
  ptkp_amount: number;
  tax_rate: number;
}

interface BPJSSetting {
  id: string;
  name: string;
  description: string | null;
  employee_percentage: number;
  company_percentage: number;
  type: string;
}

// Define the type for tax calculation inputs
interface CalculationInput {
  salary: number;
  taxStatus: string;
}

// Define the type for BPJS calculation inputs
interface BPJSCalcInput {
  salary: number;
  jkkRiskLevel: string;
}

// Sample data for tax settings
const sampleTaxSettings: TaxSetting[] = [
  {
    id: '1',
    name: 'TK/0',
    description: 'Tidak Kawin/0',
    ptkp_amount: 54000000,
    tax_rate: 5
  },
  {
    id: '2',
    name: 'K/0',
    description: 'Kawin/0',
    ptkp_amount: 58500000,
    tax_rate: 5
  },
  {
    id: '3',
    name: 'K/1',
    description: 'Kawin/1 anak',
    ptkp_amount: 63000000,
    tax_rate: 5
  },
  {
    id: '4',
    name: 'K/2',
    description: 'Kawin/2 anak',
    ptkp_amount: 67500000,
    tax_rate: 5
  }
];

// Sample data for BPJS settings
const sampleBPJSSettings: BPJSSetting[] = [
  {
    id: '1',
    name: 'BPJS Kesehatan',
    description: 'Jaminan pemeliharaan kesehatan',
    employee_percentage: 1,
    company_percentage: 4,
    type: 'kesehatan'
  },
  {
    id: '2',
    name: 'BPJS JHT',
    description: 'Jaminan Hari Tua',
    employee_percentage: 2,
    company_percentage: 3.7,
    type: 'jht'
  },
  {
    id: '3',
    name: 'BPJS JP',
    description: 'Jaminan Pensiun',
    employee_percentage: 1,
    company_percentage: 2,
    type: 'jp'
  },
  {
    id: '4',
    name: 'BPJS JKK',
    description: 'Jaminan Kecelakaan Kerja',
    employee_percentage: 0,
    company_percentage: 0.24,
    type: 'jkk'
  },
  {
    id: '5',
    name: 'BPJS JKM',
    description: 'Jaminan Kematian',
    employee_percentage: 0,
    company_percentage: 0.3,
    type: 'jkm'
  }
];

export default function Settings() {
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [bpjsSettings, setBPJSSettings] = useState<BPJSSetting[]>([]);
  const [calcInput, setCalcInput] = useState<CalculationInput>({
    salary: 0,
    taxStatus: "TK/0",
  });
  const [calcResults, setCalcResults] = useState<any>(null);
  const [bpjsCalcInput, setBPJSCalcInput] = useState<BPJSCalcInput>({
    salary: 0,
    jkkRiskLevel: "low",
  });
  const [bpjsCalcResults, setBPJSCalcResults] = useState<any>(null);

  useEffect(() => {
    // Use sample data since tables don't exist yet
    setTaxSettings(sampleTaxSettings);
    setBPJSSettings(sampleBPJSSettings);
    
    // Display console warning about missing tables
    console.warn("Warning: tax_settings and bpjs_settings tables don't exist in the database. Using sample data instead.");
    toast.warning("Menggunakan data sampel untuk pengaturan pajak dan BPJS");
  }, []);

  const handleTaxCalculate = () => {
    try {
      // Find the selected tax status
      const selectedTaxSetting = taxSettings.find(tax => tax.name === calcInput.taxStatus);
      if (!selectedTaxSetting) throw new Error("Tax status not found");
      
      // Find BPJS settings by type
      const bpjsKes = bpjsSettings.find(bpjs => bpjs.type === "kesehatan");
      const bpjsJHT = bpjsSettings.find(bpjs => bpjs.type === "jht");
      const bpjsJP = bpjsSettings.find(bpjs => bpjs.type === "jp");
      const bpjsJKK = bpjsSettings.find(bpjs => bpjs.type === "jkk");
      const bpjsJKM = bpjsSettings.find(bpjs => bpjs.type === "jkm");
      
      // Calculate BPJS Kesehatan
      const bpjsKesEmployee = calcInput.salary * (bpjsKes?.employee_percentage || 0) / 100;
      const bpjsKesCompany = calcInput.salary * (bpjsKes?.company_percentage || 0) / 100;
      
      // Calculate BPJS Ketenagakerjaan
      const bpjsJHTEmployee = calcInput.salary * (bpjsJHT?.employee_percentage || 0) / 100;
      const bpjsJHTCompany = calcInput.salary * (bpjsJHT?.company_percentage || 0) / 100;
      const bpjsJPEmployee = calcInput.salary * (bpjsJP?.employee_percentage || 0) / 100;
      const bpjsJPCompany = calcInput.salary * (bpjsJP?.company_percentage || 0) / 100;
      const bpjsJKKCompany = calcInput.salary * (bpjsJKK?.company_percentage || 0) / 100;
      const bpjsJKMCompany = calcInput.salary * (bpjsJKM?.company_percentage || 0) / 100;
      
      // Calculate total deductions
      const totalBPJSEmployeeContributions = bpjsKesEmployee + bpjsJHTEmployee + bpjsJPEmployee;
      const totalBPJSCompanyContributions = bpjsKesCompany + bpjsJHTCompany + bpjsJPCompany + bpjsJKKCompany + bpjsJKMCompany;
      
      // Calculate taxable income and tax
      const yearlyIncome = calcInput.salary * 12;
      const PKP = Math.max(0, yearlyIncome - selectedTaxSetting.ptkp_amount);
      const tax = PKP * (selectedTaxSetting.tax_rate / 100);
      const monthlyTax = tax / 12;
      
      // Calculate net salary
      const netSalary = calcInput.salary - totalBPJSEmployeeContributions - monthlyTax;
      
      setCalcResults({
        bpjsKesEmployee,
        bpjsKesCompany,
        bpjsJHTEmployee,
        bpjsJHTCompany,
        bpjsJPEmployee,
        bpjsJPCompany,
        bpjsJKKCompany,
        bpjsJKMCompany,
        totalBPJSEmployeeContributions,
        totalBPJSCompanyContributions,
        yearlySalary: yearlyIncome,
        taxablePKP: PKP,
        yearlyTax: tax,
        monthlyTax,
        netSalary
      });
      
      toast.success("Perhitungan pajak berhasil!");
      
    } catch (error: any) {
      console.error("Calculation error:", error);
      toast.error(`Gagal melakukan perhitungan pajak: ${error.message}`);
    }
  };

  const handleBPJSCalculate = () => {
    try {
      // Salary caps
      const kesehatanCap = 12000000;
      const jpCap = 9077600;

      // Get BPJS settings
      const bpjsKes = bpjsSettings.find(bpjs => bpjs.type === "kesehatan");
      const bpjsJHT = bpjsSettings.find(bpjs => bpjs.type === "jht");
      const bpjsJP = bpjsSettings.find(bpjs => bpjs.type === "jp");
      const bpjsJKM = bpjsSettings.find(bpjs => bpjs.type === "jkm");

      // Determine JKK rate based on risk level
      const jkkRates: Record<string, number> = {
        "very-low": 0.24,
        "low": 0.54,
        "medium": 0.89,
        "high": 1.27,
        "very-high": 1.74
      };
      const jkkRate = jkkRates[bpjsCalcInput.jkkRiskLevel] || 0.54; // Default to low if invalid

      // Calculate BPJS Kesehatan
      const kesehatanWage = Math.min(bpjsCalcInput.salary, kesehatanCap);
      const bpjsKesEmployee = kesehatanWage * (bpjsKes?.employee_percentage || 0) / 100;
      const bpjsKesCompany = kesehatanWage * (bpjsKes?.company_percentage || 0) / 100;

      // Calculate BPJS Ketenagakerjaan
      const bpjsJHTEmployee = bpjsCalcInput.salary * (bpjsJHT?.employee_percentage || 0) / 100;
      const bpjsJHTCompany = bpjsCalcInput.salary * (bpjsJHT?.company_percentage || 0) / 100;
      const jpWage = Math.min(bpjsCalcInput.salary, jpCap);
      const bpjsJPEmployee = jpWage * (bpjsJP?.employee_percentage || 0) / 100;
      const bpjsJPCompany = jpWage * (bpjsJP?.company_percentage || 0) / 100;
      const bpjsJKKCompany = bpjsCalcInput.salary * jkkRate / 100;
      const bpjsJKMCompany = bpjsCalcInput.salary * (bpjsJKM?.company_percentage || 0) / 100;

      // Calculate totals
      const totalBPJSEmployeeContributions = bpjsKesEmployee + bpjsJHTEmployee + bpjsJPEmployee;
      const totalBPJSCompanyContributions = bpjsKesCompany + bpjsJHTCompany + bpjsJPCompany + bpjsJKKCompany + bpjsJKMCompany;

      setBPJSCalcResults({
        bpjsKesEmployee,
        bpjsKesCompany,
        bpjsJHTEmployee,
        bpjsJHTCompany,
        bpjsJPEmployee,
        bpjsJPCompany,
        bpjsJKKCompany,
        bpjsJKMCompany,
        totalBPJSEmployeeContributions,
        totalBPJSCompanyContributions
      });

      toast.success("Perhitungan BPJS berhasil!");
    } catch (error: any) {
      console.error("BPJS Calculation error:", error);
      toast.error(`Gagal melakukan perhitungan BPJS: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan aplikasi</p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Akun</TabsTrigger>
          <TabsTrigger value="company">Perusahaan</TabsTrigger>
          <TabsTrigger value="tax">Pajak & BPJS</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>
                Lihat dan perbarui informasi profil pengguna Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" placeholder="Nama Lengkap" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="email@example.com" type="email" />
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Perusahaan</CardTitle>
              <CardDescription>
                Kelola informasi dan pengaturan perusahaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nama Perusahaan</Label>
                <Input id="companyName" placeholder="PT Example Indonesia" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Alamat</Label>
                <Input id="companyAddress" placeholder="Jl. Example No. 123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNPWP">NPWP Perusahaan</Label>
                <Input id="companyNPWP" placeholder="00.000.000.0-000.000" />
              </div>
              <Button>Simpan Perubahan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          {/* Tax calculation card */}
          <Card>
            <CardHeader>
              <CardTitle>Kalkulator Pajak</CardTitle>
              <CardDescription>
                Hitung estimasi pajak dan iuran BPJS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Gaji Bruto</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="0"
                    value={calcInput.salary || ''}
                    onChange={(e) => setCalcInput({...calcInput, salary: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxStatus">Status Pajak</Label>
                  <select
                    id="taxStatus"
                    className="w-full p-2 border rounded"
                    value={calcInput.taxStatus}
                    onChange={(e) => setCalcInput({...calcInput, taxStatus: e.target.value})}
                  >
                    {taxSettings.map(tax => (
                      <option key={tax.id} value={tax.name}>
                        {tax.name} - {tax.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleTaxCalculate} className="w-full">Hitung</Button>

              {calcResults && (
                <div className="border rounded-lg p-4 mt-4 space-y-4">
                  <h3 className="font-semibold text-lg">Hasil Perhitungan</h3>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">BPJS Kesehatan</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Kontribusi Karyawan (1%):</p>
                      <p className="text-right">
                        {calcResults.bpjsKesEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Kontribusi Perusahaan (4%):</p>
                      <p className="text-right">
                        {calcResults.bpjsKesCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">BPJS Ketenagakerjaan</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>JHT Karyawan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJHTEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JHT Perusahaan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJHTCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JP Karyawan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJPEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JP Perusahaan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJPCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JKK Perusahaan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJKKCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JKM Perusahaan:</p>
                      <p className="text-right">
                        {calcResults.bpjsJKMCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Pajak Penghasilan (PPh21)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Penghasilan Tahunan:</p>
                      <p className="text-right">
                        {calcResults.yearlySalary.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>PTKP:</p>
                      <p className="text-right">
                        {(taxSettings.find(t => t.name === calcInput.taxStatus)?.ptkp_amount || 0).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>PKP (Tahunan):</p>
                      <p className="text-right">
                        {calcResults.taxablePKP.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Pajak Tahunan:</p>
                      <p className="text-right">
                        {calcResults.yearlyTax.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Pajak Bulanan:</p>
                      <p className="text-right">
                        {calcResults.monthlyTax.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-base font-semibold">
                      <p>Total Potongan:</p>
                      <p className="text-right">
                        {(calcResults.totalBPJSEmployeeContributions + calcResults.monthlyTax).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Gaji Bersih:</p>
                      <p className="text-right">
                        {calcResults.netSalary.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BPJS Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle>Kalkulator BPJS</CardTitle>
              <CardDescription>
                Hitung iuran BPJS Kesehatan dan Ketenagakerjaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpjsSalary">Gaji Bruto</Label>
                  <Input
                    id="bpjsSalary"
                    type="number"
                    placeholder="0"
                    value={bpjsCalcInput.salary || ''}
                    onChange={(e) => setBPJSCalcInput({...bpjsCalcInput, salary: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jkkRiskLevel">Tingkat Risiko JKK</Label>
                  <select
                    id="jkkRiskLevel"
                    className="w-full p-2 border rounded"
                    value={bpjsCalcInput.jkkRiskLevel}
                    onChange={(e) => setBPJSCalcInput({...bpjsCalcInput, jkkRiskLevel: e.target.value})}
                  >
                    <option value="very-low">Sangat Rendah (0.24%)</option>
                    <option value="low">Rendah (0.54%)</option>
                    <option value="medium">Sedang (0.89%)</option>
                    <option value="high">Tinggi (1.27%)</option>
                    <option value="very-high">Sangat Tinggi (1.74%)</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleBPJSCalculate} className="w-full">Hitung</Button>

              {bpjsCalcResults && (
                <div className="border rounded-lg p-4 mt-4 space-y-4">
                  <h3 className="font-semibold text-lg">Hasil Perhitungan BPJS</h3>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">BPJS Kesehatan</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Kontribusi Karyawan (1%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsKesEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Kontribusi Perusahaan (4%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsKesCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">BPJS Ketenagakerjaan</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>JHT Karyawan (2%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJHTEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JHT Perusahaan (3.7%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJHTCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JP Karyawan (1%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJPEmployee.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JP Perusahaan (2%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJPCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JKK Perusahaan:</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJKKCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>JKM Perusahaan (0.2%):</p>
                      <p className="text-right">
                        {bpjsCalcResults.bpjsJKMCompany.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-base font-semibold">
                      <p>Total Kontribusi Karyawan:</p>
                      <p className="text-right">
                        {bpjsCalcResults.totalBPJSEmployeeContributions.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Total Kontribusi Perusahaan:</p>
                      <p className="text-right">
                        {bpjsCalcResults.totalBPJSCompanyContributions.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                      <p>Total Iuran BPJS:</p>
                      <p className="text-right">
                        {(bpjsCalcResults.totalBPJSEmployeeContributions + bpjsCalcResults.totalBPJSCompanyContributions).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tax Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Pajak</CardTitle>
                <CardDescription>Status PTKP dan Tarif Pajak</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxSettings.map((tax) => (
                    <div key={tax.id} className="border-b pb-2">
                      <p className="font-medium">{tax.name}</p>
                      <p className="text-sm text-muted-foreground">{tax.description}</p>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>PTKP:</span>
                        <span>
                          {tax.ptkp_amount.toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tarif:</span>
                        <span>{tax.tax_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BPJS Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan BPJS</CardTitle>
                <CardDescription>Tarif Kontribusi BPJS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bpjsSettings.map((bpjs) => (
                    <div key={bpjs.id} className="border-b pb-2">
                      <p className="font-medium">{bpjs.name}</p>
                      <p className="text-sm text-muted-foreground">{bpjs.description}</p>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>Karyawan:</span>
                        <span>{bpjs.employee_percentage}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Perusahaan:</span>
                        <span>{bpjs.company_percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}