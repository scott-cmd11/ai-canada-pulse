/**
 * Tree-shaken ECharts instance — registers only the chart types and components
 * used across the dashboard. Import this instead of the full "echarts" package
 * to save ~700KB of unused chart types.
 */
import * as echarts from "echarts/core"

import { BarChart, LineChart, PieChart, ScatterChart } from "echarts/charts"
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components"
import { SVGRenderer } from "echarts/renderers"

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  SVGRenderer,
])

export default echarts
