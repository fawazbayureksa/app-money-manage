import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';

interface AlertBadgeProps {
  count: number;
  visible?: boolean;
}

export default function AlertBadge({ count, visible = true }: AlertBadgeProps) {
  const theme = useTheme();

  if (!visible || count === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Badge
        size={18}
        style={[styles.badge, { backgroundColor: theme.colors.error }]}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -8,
    zIndex: 1,
  },
  badge: {
    fontWeight: 'bold',
    fontSize: 10,
  },
});
