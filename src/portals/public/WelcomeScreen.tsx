import React from 'react';
import { useNavigate } from 'react-router-native';

import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import ScreenLayout from 'src/shared/components/ScreenLayout';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <ScreenLayout variant="centered">
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
        <Button text="Login" fullWidth onPress={() => navigate('/login')} />
        <Button text="Register" fullWidth onPress={() => navigate('/register')} />
      </ButtonRow>
    </ScreenLayout>
  );
};

export default WelcomeScreen;
