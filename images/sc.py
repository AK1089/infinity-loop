from PIL import Image

def make_corners_transparent(image_path):
    img = Image.open(image_path)
    
    # Ensure the image is in RGBA format to support transparency
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Load the image's pixel data
    pixels = img.load()

    width, height = img.size
    
    # Define the size of the grid to be made transparent
    grid_size = 10

    # Loop over the pixels of each corner and set their alpha value to 0 (transparent)
    for x in range(grid_size):
        for y in range(grid_size):
            # Top-left corner
            pixels[x, y] = pixels[x, y][:3] + (0,)
            # Top-right corner
            pixels[width - x - 1, y] = pixels[width - x - 1, y][:3] + (0,)
            # Bottom-left corner
            pixels[x, height - y - 1] = pixels[x, height - y - 1][:3] + (0,)
            # Bottom-right corner
            pixels[width - x - 1, height - y - 1] = pixels[width - x - 1, height - y - 1][:3] + (0,)

    # Save the modified image
    img.save(image_path)

# List of image filenames
images = [f"tile_{i}.png" for i in range(6)]

# Process each image
for image_path in images:
    make_corners_transparent(image_path)

