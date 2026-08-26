'use client';

import React from 'react';
import { AppleAuthExperience } from '@/components/auth/AppleAuthExperience';

export default function LoginPage() {
  return <AppleAuthExperience initialMode="login" />;
}
