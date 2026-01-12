"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Copy, CheckCircle, AlertCircle, Key } from "lucide-react";

const encryptFormSchema = z.object({
  publicKey: z.string().min(1, "Public key is required"),
  message: z.string().min(1, "Message is required"),
});

type EncryptFormData = z.infer<typeof encryptFormSchema>;

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [keySize, setKeySize] = useState<number>(2048);
  const [privateKey, setPrivateKey] = useState<string>("");
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);

  const form = useForm<EncryptFormData>({
    resolver: zodResolver(encryptFormSchema),
    defaultValues: {
      publicKey: "",
      message: "",
    },
  });

  // Encrypt message mutation
  const encryptMutation = useMutation({
    mutationFn: async (data: EncryptFormData) => {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.message,
          publicKey: data.publicKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to encrypt message");
      }

      return response.json();
    },
  });

  // Generate key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (keySize: number) => {
      const response = await fetch("/api/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keySize: keySize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate RSA key");
      }

      return response.json();
    },
    onSuccess: (result) => {
      // Set the public key content (without PEM markers) in the form
      form.setValue("publicKey", result.publicKeyContent);
      // Store the private key for display
      setPrivateKey(result.privateKey);
    },
  });

  const onSubmit = (data: EncryptFormData) => {
    encryptMutation.mutate(data);
  };

  const copyToClipboard = async () => {
    if (encryptMutation.data?.encrypted) {
      try {
        await navigator.clipboard.writeText(encryptMutation.data.encrypted);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const copyPrivateKeyToClipboard = async () => {
    if (privateKey) {
      try {
        await navigator.clipboard.writeText(privateKey);
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      } catch (err) {
        console.error("Failed to copy private key to clipboard:", err);
      }
    }
  };

  const generateKey = () => {
    generateKeyMutation.mutate(keySize);
  };

  // Get error from either mutation
  const error = encryptMutation.error || generateKeyMutation.error;
  const errorMessage = error instanceof Error ? error.message : error ? "An error occurred" : "";

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <Lock className="mr-3 w-8 h-8 text-indigo-600" />
            <h1 className="font-bold text-gray-900 text-4xl">Message Encryptor</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Encrypt your messages using RSA public key encryption
          </p>
        </div>

        <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
          {/* Input Form */}
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="mb-6 font-semibold text-gray-900 text-2xl">Encrypt Message</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="publicKey"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel className="font-medium text-base">Public Key</FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            value={keySize.toString()}
                            onValueChange={(value) => setKeySize(Number(value))}
                            disabled={generateKeyMutation.isPending}
                          >
                            <SelectTrigger size="sm" className="w-[140px]">
                              <SelectValue placeholder="Key size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1024">1024 bits</SelectItem>
                              <SelectItem value="2048">2048 bits</SelectItem>
                              <SelectItem value="3072">3072 bits</SelectItem>
                              <SelectItem value="4096">4096 bits</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={generateKey}
                            disabled={generateKeyMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="text-sm"
                          >
                            {generateKeyMutation.isPending ? (
                              <div className="flex items-center">
                                <div className="mr-2 border-gray-600 border-b-2 rounded-full w-3 h-3 animate-spin"></div>
                                Generating...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Key className="mr-1 w-3 h-3" />
                                Generate Key
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your RSA public key content (without BEGIN/END markers) or click 'Generate Key' to create a new one"
                          className="min-h-[120px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-base">Message to Encrypt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the message you want to encrypt"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={encryptMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 py-3 w-full text-white"
                >
                  {encryptMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="mr-2 border-white border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                      Encrypting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Lock className="mr-2 w-4 h-4" />
                      Encrypt Message
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            {errorMessage && (
              <div className="bg-red-50 mt-4 p-4 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
                  <span className="text-red-700">{errorMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Result Display */}
          <div className="space-y-6 bg-white shadow-lg p-6 rounded-lg">
            <div>
              <h2 className="mb-6 font-semibold text-gray-900 text-2xl">Encrypted Result</h2>
              
              {encryptMutation.data?.encrypted ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Label className="block mb-2 font-medium text-gray-700 text-sm">
                      Encrypted Message
                    </Label>
                    <div className="relative">
                      <Textarea
                        value={encryptMutation.data.encrypted}
                        readOnly
                        className="bg-gray-50 min-h-[200px] font-mono text-sm"
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="top-2 right-2 absolute"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700">
                        Message encrypted successfully!
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[200px] text-gray-500">
                  <div className="text-center">
                    <Lock className="mx-auto mb-4 w-12 h-12 text-gray-300" />
                    <p>Encrypted result will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {privateKey && (
              <div className="pt-6 border-gray-200 border-t">
                <h2 className="mb-6 font-semibold text-gray-900 text-2xl">Generated Private Key</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <Label className="block mb-2 font-medium text-gray-700 text-sm">
                      Private Key
                    </Label>
                    <div className="relative">
                      <Textarea
                        value={privateKey}
                        readOnly
                        className="bg-gray-50 min-h-[200px] font-mono text-sm"
                      />
                      <Button
                        onClick={copyPrivateKeyToClipboard}
                        variant="outline"
                        size="sm"
                        className="top-2 right-2 absolute"
                      >
                        {copiedPrivateKey ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-700">
                        ⚠️ Keep your private key secure! Never share it with anyone.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white shadow-lg mt-8 p-6 rounded-lg">
          <h3 className="mb-4 font-semibold text-gray-900 text-xl">How to Use</h3>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center items-center bg-indigo-100 mx-auto mb-3 rounded-full w-12 h-12">
                <span className="font-bold text-indigo-600">1</span>
              </div>
              <h4 className="mb-2 font-medium text-gray-900">Enter Public Key</h4>
              <p className="text-gray-600 text-sm">
                Paste your RSA public key content (the API will automatically add the PEM wrapper)
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center bg-indigo-100 mx-auto mb-3 rounded-full w-12 h-12">
                <span className="font-bold text-indigo-600">2</span>
              </div>
              <h4 className="mb-2 font-medium text-gray-900">Write Message</h4>
              <p className="text-gray-600 text-sm">
                Enter the message you want to encrypt. This will be encrypted using the public key.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center bg-indigo-100 mx-auto mb-3 rounded-full w-12 h-12">
                <span className="font-bold text-indigo-600">3</span>
              </div>
              <h4 className="mb-2 font-medium text-gray-900">Get Result</h4>
              <p className="text-gray-600 text-sm">
                Click &quot;Encrypt Message&quot; to get your encrypted result. You can copy it to clipboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
