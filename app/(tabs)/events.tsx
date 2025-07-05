import { StyleSheet, Text, View } from 'react-native';

export default function EventScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Events</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
});