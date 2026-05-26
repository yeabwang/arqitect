Current tracking issues

Review the current implmentation and fix the following issues. For the visual feedback, I have attached : 

![1779754734040](image/current-issues/1779754734040.png)

![1779754762176](image/current-issues/1779754762176.png)

Side bar issues:

The left and the right sidebar are currently shadowing the liveblock canvas. The actual implmentation should use position fixed or position with absolute higher z-index so the canvas extend fully behind them and the sidebars should have a semi trnasparent or solid backround with subtle shadow so that they feel elevated

the canvas backgroudn with dottend pattern should be vsisble edge to edge underneath both sidebars.

Dragging and droping blocks:

All shapes should have connecting dots in all of the four sides, the current version only have connnecting dot in the top and bottom, add connection dots in all four sides.

When they get dropped to the canvas they will lose their shapes and they appear somewhat rectangular, they must preserve the shape when we drop it to the canvas,
