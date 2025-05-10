import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useNavigate} from 'react-router-native';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import ScreenLayout from 'shared/components/ScreenLayout';
import ButtonRow from 'shared/components/ButtonRow';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <ScreenLayout variant="centered">
      <View style={layout.innerContainer}>
        {/* Intro Glass Card */}
        <Card
          variant="glass"
          title="Welcome to GymBuddy"
          text="Your all-in-one fitness companion. Track, train, and thrive with a connected fitness community."
        />

        {/* Feature Cards */}
        <Card
          variant="feature"
          title="🏋️ Workout Tracking"
          text="Log your workouts, track progress, and stay consistent with personalized plans."
        />
        <Card
          variant="feature"
          title="🤝 Social Fitness"
          text="Follow friends, share achievements, and join challenges to stay motivated."
        />

        {/* Buttons */}
        <ButtonRow>
          <Button text="Login" onPress={() => navigate('/login')} />
          <Button text="Register" onPress={() => navigate('/register')} />
        </ButtonRow>
      </View>
    </ScreenLayout>
  );
};

export default WelcomeScreen;

const layout = StyleSheet.create({
  innerContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
});
