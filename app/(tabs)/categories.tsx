import { Redirect } from 'expo-router';
import React from 'react';

// Redirect to the categories stack
export default function CategoriesTab() {
  return <Redirect href="/categories" />;
}
