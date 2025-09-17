import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from 'shared/theme/ThemeProvider';
import { spacing } from 'shared/theme/tokens';

interface CollapsibleListProps {
  title: React.ReactNode;
  items: (string | React.ReactNode)[];
  initiallyExpanded?: boolean;
}

const CollapsibleList = ({ title, items, initiallyExpanded = false }: CollapsibleListProps) => {
  const { componentStyles } = useTheme();
  const styles = componentStyles.collapsibleList;
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
      </View>

      {!expanded ? (
        <TouchableOpacity onPress={toggle}>
          <Text style={styles.toggle}>
            ▶️ Show {items.length}
            {typeof title === 'string' ? ` ${title.toLowerCase()}` : ''}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {items.map((item, idx) =>
            typeof item === 'string' ? (
              <Text key={idx} style={styles.item}>
                {item}
              </Text>
            ) : (
              <View key={idx} style={{ marginBottom: spacing.xs }}>
                {item}
              </View>
            ),
          )}
          <TouchableOpacity onPress={toggle}>
            <Text style={styles.toggleCollapse}>🔽 Hide</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default CollapsibleList;
