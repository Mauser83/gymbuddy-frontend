import React from 'react';
import {View, Pressable, FlatList, SectionList, Text} from 'react-native';
import {useNavigate} from 'react-router-native';
import {useQuery} from '@apollo/client';
import ScreenLayout from '../../../../shared/components/ScreenLayout';
import Title from '../../../../shared/components/Title';
import Card from '../../../../shared/components/Card';
import LoadingState from '../../../../shared/components/LoadingState';
import NoResults from '../../../../shared/components/NoResults';
import {spacing} from '../../../../shared/theme/tokens';
import {
  GET_MY_WORKOUT_PLANS,
  GET_SHARED_WORKOUT_PLANS,
} from '../graphql/userWorkouts.graphql';
import Button from 'shared/components/Button';

export default function MyWorkoutPlansScreen() {
  const navigate = useNavigate();

  const {data: myData, loading: loadingMy} = useQuery(GET_MY_WORKOUT_PLANS);
  const {data: sharedData, loading: loadingShared} = useQuery(
    GET_SHARED_WORKOUT_PLANS,
  );

  const myPlans = myData?.workoutPlans ?? [];
  const sharedPlans = sharedData?.sharedWorkoutPlans ?? [];
  
  const sections = [
      { title: 'My Plans', data: myPlans },
      { title: 'Shared With Me', data: sharedPlans },
  ];

  const renderPlan = ({item: plan}: {item: any}) => (
    <Pressable
        key={plan.id}
        onPress={() => navigate(`/user/view-plan/${plan.id}`)}
        style={{marginTop: spacing.md}}>
        <Card title={plan.name} text={plan.description} showChevron />
    </Pressable>
  );

  const renderSectionHeader = ({section: {title, data}}: {section: any}) => (
    <View style={{ marginTop: spacing.lg }}>
        <Title text={title} />
        {data.length === 0 && <NoResults message="No plans found in this section." />}
    </View>
  );

  if (loadingMy || loadingShared) {
    return <LoadingState text="Loading plans..." />;
  }
    
  return (
    // Use a non-scrolling layout as SectionList will handle it
    <ScreenLayout>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderPlan}
        renderSectionHeader={renderSectionHeader}
        ListFooterComponent={
            <View style={{ padding: spacing.md }}>
                <Button
                    text="Create New Workout Plan"
                    onPress={() => navigate('/workoutplan/builder')}
                />
            </View>
        }
      />
    </ScreenLayout>
  );
}
