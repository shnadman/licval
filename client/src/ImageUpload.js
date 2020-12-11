import React from "react";
import ImageUploading from "react-images-uploading";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { useForm } from "react-hook-form";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
  form: {
    display: "flex",
    width: "20vw",
    height: "60vh",
    justifyContent: "space-around",
    flexDirection: "column",
  },
  buttons: { display: "flex" },

  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
}));

export default ({ images, setImages }) => {
  const maxNumber = 4;
  const classes = useStyles();

  const renderGuideText = (imageList) => {
    switch (imageList.length) {
      case 0:
        return <Typography>בחר תעודת זהות </Typography>;
      case 1:
        return <Typography>בחר ספח תעודת זהות </Typography>;
      case 2:
        return <Typography>בחר רשיון נהיגה</Typography>;
      case 3:
        return <Typography>בחר רשיון רכב</Typography>;
      case 4:
        return <Typography>הזן כתובת אימייל</Typography>;
      default:
        <Typography>בחר תעודת זהות </Typography>;
    }
  };

  const onChange = (imageList, addUpdateIndex) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };

  return (
    <ImageUploading
      multiple
      value={images}
      onChange={onChange}
      maxNumber={maxNumber}
      dataURLKey="data_url"
    >
      {({
        imageList,
        onImageUpload,
        onImageRemoveAll,
        onImageUpdate,
        onImageRemove,
        isDragging,
        dragProps,
      }) => (
        // write your building UI
        <div>
          <div style={{ padding: 15 }}>
            <div className={classes.form}>
              <div className={classes.buttons}>
                <Button
                  variant={imageList.length === 4 ? "disabled" : "contained"}
                  color="primary"
                  style={isDragging ? { color: "red" } : undefined}
                  onClick={onImageUpload}
                  {...dragProps}
                >
                  {renderGuideText(imageList)}
                </Button>
                <Button
                  variant={imageList.length === 0 ? "disabled" : "contained"}
                  color="secondary"
                  onClick={onImageRemoveAll}
                >
                  הסר את כל התמונות
                </Button>
              </div>
              {imageList.map((image, index) => (
                <div
                  key={index}
                  className="image-item"
                  style={{
                    padding: 15,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img src={image["data_url"]} alt="" width="100" />
                  <div className="image-item__btn-wrapper">
                    <Button
                      color="primary"
                      variant="outlined"
                      onClick={() => onImageUpdate(index)}
                    >
                      עדכן
                    </Button>
                    <Button
                      color="secondary"
                      variant="outlined"
                      onClick={() => onImageRemove(index)}
                    >
                      הסר
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ImageUploading>
  );
};
