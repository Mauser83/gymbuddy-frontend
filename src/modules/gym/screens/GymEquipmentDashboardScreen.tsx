// not in use, was placeholder

// import React from 'react';
// import { useQuery } from '@apollo/client';
// import { GET_GYM_EQUIPMENT_STATS } from '@/graphql/gymEquipment';
// import { useGymContext } from '@/hooks/useGymContext';
// import { ScreenLayout } from '@/components/layouts/ScreenLayout';
// import { Title } from '@/components/ui/Title';
// import { Card } from '@/components/ui/Card';
// import { LoadingState } from '@/components/ui/LoadingState';
// import { NoResults } from '@/components/ui/NoResults';

// export default function GymEquipmentDashboardScreen() {
//   const { gymId } = useGymContext();
//   const { data, loading } = useQuery(GET_GYM_EQUIPMENT_STATS, {
//     variables: { gymId },
//   });

//   if (loading) return <LoadingState text="Loading equipment stats..." />;
//   if (!data?.gymEquipmentStats) return <NoResults message="No equipment stats available." />;

//   const { total, byCategory, lastUpdated } = data.gymEquipmentStats;

//   return (
//     <ScreenLayout scroll>
//       <Title text="Gym Equipment Dashboard" subtitle="Overview of your gym's equipment" />

//       <Card title="Total Equipment" text={`${total} items`} />
//       <Card title="Last Updated" text={new Date(lastUpdated).toLocaleString()} />

//       {byCategory.map((cat) => (
//         <Card
//           key={cat.name}
//           title={cat.name}
//           text={`${cat.count} items`}
//         />
//       ))}
//     </ScreenLayout>
//   );
// }
