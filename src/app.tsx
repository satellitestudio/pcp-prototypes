import React from 'react'
import Home from './pages/home/home'
import Search from './pages/search/search'
import HistorySroll from './pages/history-scroll/history-scroll'
import MapNavigation from './pages/map-navigation/map-navigation'
import MapScrolling from './pages/history-map-connected/history-map-connected'
import { Router } from '@reach/router'

const App: React.FC = (): React.ReactElement => {
  return (
    <Router>
      <Home path={`${process.env.PUBLIC_URL}/`} default />
      <Search path={`${process.env.PUBLIC_URL}/search`} />
      <HistorySroll path={`${process.env.PUBLIC_URL}/scrolling`} />
      <MapNavigation path={`${process.env.PUBLIC_URL}/map-navigation`} />
      <MapScrolling path={`${process.env.PUBLIC_URL}/map-scrolling`} />
    </Router>
  )
}

export default App
